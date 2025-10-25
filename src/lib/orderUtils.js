// Shared utility functions for Orders components
export const getStatusBadge = (status) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return "success"
    case "processing":
      return "info"
    case "shipped":
      return "primary"
    case "pending":
      return "warning"
    case "cancelled":
      return "danger"
    default:
      return "secondary"
  }
}

export const formatDate = (dateStr) => {
  if (!dateStr) return "N/A"
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }) + ", " + date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    })
  } catch {
    return dateStr
  }
}

export const formatDateForScreen = (dateStr) => {
  if (!dateStr) return "N/A"
  try {
    return new Date(dateStr).toLocaleString()
  } catch {
    return dateStr
  }
}

export const calculateOrderStats = (orders) => {
  const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
  const totalOrders = orders.length
  const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const totalItems = orders.reduce((sum, order) => sum + (order.items || []).length, 0)
  
  return {
    totalRevenue,
    totalOrders, 
    averageOrder,
    totalItems
  }
}