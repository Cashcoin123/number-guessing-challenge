function createResponse(ok, payload) {
  return { ok, ...payload };
}

module.exports = {
  createResponse,
};
