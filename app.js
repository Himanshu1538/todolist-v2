//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require("dotenv").config();
// (R)const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

const user_name = process.env.USER_NAME;
const user_pw = process.env.USER_PW;

mongoose.connect(`mongodb+srv://${user_name}:${user_pw}@cluster0.0zqrd.mongodb.net/todolistDB?retryWrites=true&w=majority`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

// "mongodb://localhost:27017/todolistDB"

// Create a Mongoose Schema.
const itemsSchema = {
  name: String
};

// Create a Mongoose Model.
const Item = mongoose.model("Item", itemsSchema);

// Create Mongoose Documents.
const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add anew item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

// An Array that will have the todo list items.
const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);

// Insert Documents in Node.js.
// Item.insertMany(defaultItems, function(err) {
//   if (err) {
//     console.log(err);
//   } else {
//     console.log("Successfully saved default items to DB.");
//   }
// });


app.get("/", function(req, res) {

  // (R)const day = date.getDate()

  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to DB.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });
});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        // Create a New List.
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        // Show an Existing List.
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });


});

app.post("/", function(req, res) {

  // Typed item on the website will be added in the itemName constant.
  const itemName = req.body.newItem;

  const listName = req.body.list;

  // Create a new mongoose document and save it.
  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    // Redirect to home route so that the added item will be visible.
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function(err, foundList) {
      console.log(foundList);
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

// A delete route to fetch checked data and delete checked items.
app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log("Successfully deleted checked item.")
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items:{_id:checkedItemId}}}, function(err, foundList){
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }
});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
