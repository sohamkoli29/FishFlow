import express from 'express'
import { supabase } from '../config/database.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// GET /api/analytics/sales-summary - Get sales summary for different time periods
router.get('/sales-summary', requireAuth, async (req, res) => {
  try {
    const { period = 'today' } = req.query // today, week, month, year
    
    // Get date ranges based on period
    const dateRanges = getDateRanges(period)
    
    // Get total sales and order count for each period
    const salesPromises = dateRanges.map(range => 
      getSalesDataForPeriod(range.start, range.end)
    )
    
    const salesData = await Promise.all(salesPromises)
    
    res.json({
      success: true,
      data: {
        period,
        summary: salesData[0], // Current period
        previous: salesData[1], // Previous period for comparison
        dateRanges
      }
    })
  } catch (error) {
    console.error('Error fetching sales summary:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sales summary'
    })
  }
})

// GET /api/analytics/revenue-trends - Get revenue trends for charts
router.get('/revenue-trends', requireAuth, async (req, res) => {
  try {
    const { period = 'week' } = req.query // day, week, month
    
    let trendsData = []
    
    if (period === 'day') {
      // Last 24 hours by hour
      trendsData = await getHourlyTrends()
    } else if (period === 'week') {
      // Last 7 days
      trendsData = await getDailyTrends(7)
    } else if (period === 'month') {
      // Last 30 days
      trendsData = await getDailyTrends(30)
    }
    
    res.json({
      success: true,
      data: {
        period,
        trends: trendsData
      }
    })
  } catch (error) {
    console.error('Error fetching revenue trends:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue trends'
    })
  }
})

// GET /api/analytics/top-products - Get best-selling products
router.get('/top-products', requireAuth, async (req, res) => {
  try {
    const { limit = 10, period = 'month' } = req.query
    
    const dateRange = getDateRangeForPeriod(period)
    
    const { data, error } = await supabase
      .from('order_items')
      .select(`
        quantity,
        unit_price,
        products (
          id,
          name,
          image_url
        )
      `)
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end)
      .order('quantity', { ascending: false })
    
    if (error) throw error

    // Aggregate product sales
    const productSales = {}
    data?.forEach(item => {
      if (!item.products) return
      
      const productId = item.products.id
      if (!productSales[productId]) {
        productSales[productId] = {
          product: item.products,
          totalQuantity: 0,
          totalRevenue: 0
        }
      }
      
      productSales[productId].totalQuantity += parseFloat(item.quantity)
      productSales[productId].totalRevenue += parseFloat(item.quantity) * parseFloat(item.unit_price)
    })
    
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, parseInt(limit))
    
    res.json({
      success: true,
      data: {
        products: topProducts,
        period
      }
    })
  } catch (error) {
    console.error('Error fetching top products:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top products'
    })
  }
})

// GET /api/analytics/order-metrics - Get order statistics
router.get('/order-metrics', requireAuth, async (req, res) => {
  try {
    const { period = 'month' } = req.query
    
    const dateRange = getDateRangeForPeriod(period)
    
    // Get total orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end)
    
    if (ordersError) throw ordersError
    
    // Calculate metrics
    const totalOrders = orders?.length || 0
    const completedOrders = orders?.filter(o => o.status === 'completed').length || 0
    const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0
    const cancelledOrders = orders?.filter(o => o.status === 'cancelled').length || 0
    
    const paidOrders = orders?.filter(o => o.payment_status === 'paid').length || 0
    const unpaidOrders = orders?.filter(o => o.payment_status === 'unpaid').length || 0
    
    const totalRevenue = orders
      ?.filter(o => o.payment_status === 'paid')
      .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0) || 0
    
    const averageOrderValue = paidOrders > 0 ? totalRevenue / paidOrders : 0
    
    res.json({
      success: true,
      data: {
        totalOrders,
        completedOrders,
        pendingOrders,
        cancelledOrders,
        paidOrders,
        unpaidOrders,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
        completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0
      }
    })
  } catch (error) {
    console.error('Error fetching order metrics:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order metrics'
    })
  }
})

// Helper functions
function getDateRanges(period) {
  const now = new Date()
  const ranges = []
  
  if (period === 'today') {
    // Today vs Yesterday
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)
    const yesterdayEnd = new Date(todayEnd)
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1)
    
    ranges.push(
      { start: todayStart.toISOString(), end: todayEnd.toISOString(), label: 'Today' },
      { start: yesterdayStart.toISOString(), end: yesterdayEnd.toISOString(), label: 'Yesterday' }
    )
  } else if (period === 'week') {
    // This week vs Last week
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(endOfWeek.getDate() + 6)
    
    const startOfLastWeek = new Date(startOfWeek)
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7)
    const endOfLastWeek = new Date(endOfWeek)
    endOfLastWeek.setDate(endOfLastWeek.getDate() - 7)
    
    ranges.push(
      { start: startOfWeek.toISOString(), end: endOfWeek.toISOString(), label: 'This Week' },
      { start: startOfLastWeek.toISOString(), end: endOfLastWeek.toISOString(), label: 'Last Week' }
    )
  } else if (period === 'month') {
    // This month vs Last month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
    
    ranges.push(
      { start: startOfMonth.toISOString(), end: endOfMonth.toISOString(), label: 'This Month' },
      { start: startOfLastMonth.toISOString(), end: endOfLastMonth.toISOString(), label: 'Last Month' }
    )
  }
  
  return ranges
}

function getDateRangeForPeriod(period) {
  const now = new Date()
  
  if (period === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    return { start: start.toISOString(), end: end.toISOString() }
  } else if (period === 'week') {
    const start = new Date(now.setDate(now.getDate() - 7))
    const end = new Date()
    return { start: start.toISOString(), end: end.toISOString() }
  } else if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    const end = new Date()
    return { start: start.toISOString(), end: end.toISOString() }
  }
  
  // Default to last 30 days
  const start = new Date(now.setDate(now.getDate() - 30))
  const end = new Date()
  return { start: start.toISOString(), end: end.toISOString() }
}

async function getSalesDataForPeriod(startDate, endDate) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
  
  if (error) throw error
  
  const paidOrders = data?.filter(order => order.payment_status === 'paid') || []
  const totalRevenue = paidOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0)
  const orderCount = paidOrders.length
  
  return {
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    orderCount,
    averageOrderValue: orderCount > 0 ? parseFloat((totalRevenue / orderCount).toFixed(2)) : 0,
    startDate,
    endDate
  }
}

async function getDailyTrends(days) {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .eq('payment_status', 'paid')
  
  if (error) throw error
  
  // Group by date
  const dailyData = {}
  data?.forEach(order => {
    const date = new Date(order.created_at).toLocaleDateString()
    if (!dailyData[date]) {
      dailyData[date] = {
        date,
        revenue: 0,
        orders: 0
      }
    }
    dailyData[date].revenue += parseFloat(order.total_amount || 0)
    dailyData[date].orders += 1
  })
  
  // Fill missing dates with zeros
  const result = []
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toLocaleDateString()
    
    result.unshift({
      date: dateStr,
      revenue: dailyData[dateStr]?.revenue || 0,
      orders: dailyData[dateStr]?.orders || 0,
      label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    })
  }
  
  return result
}

async function getHourlyTrends() {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 1)
  
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .eq('payment_status', 'paid')
  
  if (error) throw error
  
  // Group by hour
  const hourlyData = {}
  data?.forEach(order => {
    const date = new Date(order.created_at)
    const hour = date.getHours()
    
    if (!hourlyData[hour]) {
      hourlyData[hour] = {
        hour,
        revenue: 0,
        orders: 0,
        label: `${hour}:00`
      }
    }
    hourlyData[hour].revenue += parseFloat(order.total_amount || 0)
    hourlyData[hour].orders += 1
  })
  
  // Fill all 24 hours
  const result = []
  for (let hour = 0; hour < 24; hour++) {
    result.push(hourlyData[hour] || {
      hour,
      revenue: 0,
      orders: 0,
      label: `${hour}:00`
    })
  }
  
  return result
}

export default router