exports.get404 = (req, res, next) => {
  return res.status(404).render("404", {
    pageTitle: "Page Not Found",
    path: "",
  });
};
