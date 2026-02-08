exports.handler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      portalLink: "https://torneros.netlify.app/",
    }),
  };
};
