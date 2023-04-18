const express = require("express");
const { auth } = require("../middlewares/auth");
const { VideoModel, validateVideo } = require("../models/videoModel");
const router = express.Router();

router.get("/", async (req, res) => {
    //http://localhost:3001/videos?page=3&perPage=5
    //http://localhost:3001/videos?perPage=10
    let perPage = req.query.perPage ? Math.min(req.query.perPage, 10) : 5;
    //http://localhost:3001/videos?page=1
    let page = req.query.page - 1 || 0;
    //http://localhost:3001/videos?perPage=5&sort=date_created
    let sort = req.query.sort || "date_created";
    //http://localhost:3001/videos?sort=date_created&reverse=yes
    let reverse = req.query.reverse == "yes" ? 1 : -1;
    const category = req.query.category;
    try {
      let filterFind={};
      // בודק אם קיבלנו קווארי של קטגוריה ואם כן משנה את הפילטר של הפיינד למציאת פרטים שקשורים לקטגוריה
      if(category){
        filterFind = {category_code:category}
      }
        let data = await VideoModel
            .find(filterFind) // filter by date_created range
            .limit(perPage) // limits of videos per page
            .skip(page * perPage) // skips of videos per page
            .sort({ [sort]: reverse }); // sorts by date_created
        res.json(data);
    } catch (err) {
        console.log(err);
        res.status(502).json({ err });
    }
});

router.get("/single/:id", async (req, res) => {
  try {
    const id = req.params.id
    let data = await VideoModel.findOne({ _id: id });
    res.json(data);
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})

router.get("/count" , async(req,res) => {
  try{
    let perPage = req.query.perPage || 5;
    // יקבל רק את כמות הרשומות בקולקשן
    const count = await VideoModel.countDocuments({})
    res.json({count,pages:Math.ceil(count/perPage)})
  }
  catch(err){
    console.log(err);
    res.status(502).json({err})
  }
})

router.post("/",auth, async (req, res) => {
  let validBody = validateVideo(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }
  try {
    let video = new VideoModel(req.body);
    video.user_id = req.tokenData._id
    await video.save();
    res.json(video)
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})
router.put("/:id", auth, async (req, res) => {
    let validBody = validateVideo(req.body);
    if (validBody.error) {
      return res.status(400).json(validBody.error.details);
    }
    try {
      let id = req.params.id;
      let data;
      // בודק אם המשתמש הוא אדמין ונותן לו אפשרות לערוך את
      // כל הרשומות גם כאלו שלא שלו
      if (req.tokenData.role == "admin") {
        data = await VideoModel.updateOne({ _id: id }, req.body);
      }
      else {
        data = await VideoModel.updateOne({ _id: id, user_id: req.tokenData._id }, req.body);
      }
      res.json(data)
    }
    catch (err) {
      console.log(err);
      res.status(502).json({ err })
    }
  })
  router.delete("/:id", auth, async (req, res) => {
    try {
      let id = req.params.id;
      let data;
      if (req.tokenData.role == "admin") {
        data = await VideoModel.deleteOne({ _id: id});
      }
      else{
        data = await VideoModel.deleteOne({ _id: id, user_id: req.tokenData._id });
      }
      res.json(data)
    }
    catch (err) {
      console.log(err);
      res.status(502).json({ err })
    }
  })

module.exports = router;