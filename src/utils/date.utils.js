function formatDate (date) {
  // Arrays for day and month names
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ]
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ]

  // Get components of the date
  const dayName = days[date.getDay()]
  const monthName = months[date.getMonth()]
  const day = date.getDate()
  const year = date.getFullYear()

  // Get hours and minutes, and determine AM/PM
  let hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  if (hours === 0) {
    hours = 12
  }

  // Ensure minutes are two digits
  const minutesStr = minutes < 10 ? '0' + minutes : minutes

  return `${dayName}, ${monthName} ${day}, ${year} ${hours}:${minutesStr} ${ampm}`
}

export default formatDate
