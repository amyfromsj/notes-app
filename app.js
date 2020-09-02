//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

//connect to Atlas database, not the local database anymore
mongoose.connect("mongodb+srv://admin-amy:Abkntepoefr9!@cluster0.b7bb1.mongodb.net/todolistDB", {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false
  })
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log(err));

//schema for Items
const itemsSchema = new mongoose.Schema({
  item: String
});

//model for Item
const Item = mongoose.model("Item", itemsSchema);

//Default items
const click = new Item({
  item: "Click the item or checkbox to mark as finished."
});

const add = new Item({
  item: "Add a new item using the plus button!"
});

//default items list
const defaultItems = [click, add];

//schema for lists
const listsSchema = mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

//model for lists
const List = new mongoose.model("List", listsSchema);

//routing
app.get("/", function(req, res) {
  Item.find(function(err, items) {
    if (items.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully added default items.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: items});
    }
  });
});

app.get("/:newListName", function(req, res) {
  const capitalizedNewListName = _.capitalize(req.params.newListName);
  List.findOne({name: capitalizedNewListName}, function(err, listFound){
    if (!err) {
      if (!listFound) {
        const newList = new List({
          name: capitalizedNewListName,
          items: defaultItems
        });
        newList.save();
        res.redirect("/" + capitalizedNewListName);
      } else {
        res.render("list", {listTitle: listFound.name, newListItems: listFound.items});
      }
    }
  });
});

//posting
app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item ({
    item: itemName
  });

  if (listName === "Today") {
    console.log(listName);
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, listFound) {
      if (!err) {
        if (listFound) {
          listFound.items.push(newItem);
          listFound.save();
          res.redirect("/" + listName);
        }
      }
    });
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  //if default list, then delete checked item
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Item successfully deleted!");
        res.redirect("/");
      }
    });
    //if custom list, find the list, delete checked item from that list
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, listFound) {
      if (!err) {
        console.log(checkedItemId);
        res.redirect("/" + listName);
      }
    });

  }
});

app.get("/work", function(req, res) {
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function(){
  console.log("Server has started successfully.");
});
