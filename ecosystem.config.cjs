module.exports = {
  apps: [
    {
      name: "gurusuite",
      script: "server.js",
      env: {
        NODE_ENV: "production",
        HOST: "0.0.0.0",
        PORT: "4175"
      }
    }
  ]
};
