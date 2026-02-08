exports.handler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      portalLink: process.env.PORTAL_LINK || "",
    }),
  };
};
