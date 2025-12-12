function success(res, message = "Success", data = {}, code = 200) {
  return res.status(code).json({ success: true, message, data });
}

function error(res, message = "Error", code = 500, details = null) {
  return res.status(code).json({ success: false, message, details });
}

module.exports = { success, error };
