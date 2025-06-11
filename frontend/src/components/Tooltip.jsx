const Tooltip = ({ visible, content, x, y }) => {
  if (!visible) {
    return null
  }

  return (
    <div
      className="absolute bg-skin-bg-accent text-skin-text text-sm p-2 rounded-md shadow-lg pointer-events-none z-50"
      style={{ top: y + 15, left: x + 15 }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}

export default Tooltip 