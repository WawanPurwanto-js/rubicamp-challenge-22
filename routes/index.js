var express = require('express');
var router = express.Router();
const mongodb = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/";

function buildConditionalQuery(columnNameParams, columnValueParams) {
  conditionalQuery = [];
  if (columnNameParams[0] == 'on') {
    conditionalQuery.push({
      "_id": parseInt(columnValueParams[0])
    });
  }
  if (columnNameParams[1] == 'on') {
    conditionalQuery.push({
      "string": columnValueParams[1]
    });
  }
  if (columnNameParams[2] == 'on') {
    conditionalQuery.push({
      "integer": columnValueParams[2]
    });
  }
  if (columnNameParams[3] == 'on') {
    conditionalQuery.push({
      "float": columnValueParams[3]
    });
  }
  if (columnNameParams[4] == 'on') {
    conditionalQuery.push({
      "date": {
        "$gte": new Date(columnValueParams[4][0]),
        "$lte": new Date(columnValueParams[4][1])
      }
    });
  }
  if (columnNameParams[5] == 'on') {
    conditionalQuery.push({
      "boolean": columnValueParams[5]
    });
  }
  return conditionalQuery;
}

router.get('/', function (req, res) {
  const columnNameParams = [req.query.ID_checkbox, req.query.String_checkbox, req.query.Integer_checkbox, req.query.Float_checkbox, req.query.Date_checkbox, req.query.Boolean_checkbox];
  const columnValueParams = [req.query.id, req.query.string, req.query.integer, req.query.float, [req.query.StartDate, req.query.EndDate], req.query.boolean];

  mongodb.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("breaddb");
    let conditionalQuery = buildConditionalQuery(columnNameParams, columnValueParams);
    let query = conditionalQuery.length == 0 ? {} : {
      $and: conditionalQuery
    };

    dbo.collection("bread").find(query).count(function (err, count) {
      if (err) throw err;

      let url = req.url == '/' ? '/?page=1' : req.url;
      let total = count;
      let page = req.query.page || 1;
      let limit = 3;
      let totalPage = Math.ceil(total / limit);
      let offSet = limit * (page - 1);

      dbo.collection("bread").find(query).skip(offSet).limit(limit).toArray(function (err, result) {
        if (err) throw err;
        res.render("index", {
          result,
          totalPage,
          page,
          url
        });
        db.close();
      });
    });
  });
});

router.get('/add', function (req, res) {
  res.render('add');
});

router.post('/add', function (req, res) {
  // AND QUERY
  mongodb.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("breaddb");
    dbo.collection("bread").find().toArray(function (err, result) {
      if (err) throw err;

      let idxMax = 0;
      for (let i = 0; i < result.length; i++) {
        if (parseInt(result[i]._id) > idxMax) {
          idxMax = parseInt(result[i]._id);
        }
      }

      let objectInserted = {
        _id: idxMax + 1,
        string: req.body.string,
        integer: req.body.integer,
        float: req.body.float,
        date: new Date(req.body.Date),
        boolean: req.body.boolean
      };
      dbo.collection("bread").insertOne(objectInserted, function (err, response) {
        if (err) throw err;

        res.redirect('/');
        db.close();
      });
    })
  });
});

router.get('/edit/:id', function (req, res) {
  let idData = req.params.id;
  mongodb.connect(url, function (err, db) {
    if (err) throw err;
    let dbo = db.db("breaddb");
    dbo.collection("bread").find({
      _id: parseInt(idData)
    }).toArray(function (err, result) {
      if (err) throw err;
      let dd = result[0]['Date'].getDate();
      let mm = result[0]['Date'].getMonth() + 1;
      let yyyy = result[0]['Date'].getFullYear();
      if (dd < 10) {
        dd = '0' + dd;
      }
      if (mm < 10) {
        mm = '0' + mm;
      }
      result[0]['Date'] = yyyy + '-' + mm + '-' + dd;
      let row = result[0];
      res.render("edit", {
        row
      });
      db.close();
    });
  })
});

router.post('/edit/:id', function (req, res) {
  let idData = req.params.id;
  mongodb.connect(url, function (err, db) {
    if (err) throw err;
    let dbo = db.db("breaddb");
    let query = {
      "_id": parseInt(idData)
    };
    let updatedValues = {
      $set: {
        string: req.body.string,
        integer: req.body.integer,
        float: req.body.float,
        boolean: req.body.boolean,
        date: new Date(req.body.date)
      }
    };
    dbo.collection("bread").updateOne(query, updatedValues, function (err, response) {
      if (err) throw err;
      res.redirect('/');
      db.close();
    })
  })
});

router.get('/delete/:id', function (req, res) {
  let idData = req.params.id;
  mongodb.connect(url, function (err, db) {
    if (err) throw err;
    let dbo = db.db("breaddb");
    let query = {
      "_id": parseInt(idData)
    };
    dbo.collection("bread").deleteOne(query, function (err, obj) {
      if (err) throw err;
      res.redirect("/");
    })
  })
});

module.exports = router;