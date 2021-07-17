//jshint esversion:6

const express = require("express");// include express
const bodyParser = require("body-parser");//include bodyParser
const mongoose = require("mongoose");// include mongoose
const _ = require("lodash");
const app = express();//initialize using express

app.set('view engine', 'ejs'); // ejs is initialized

app.use(bodyParser.urlencoded({extended: true}));//allows for parsing of the body
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistdb",{ useNewUrlParser: true, useUnifiedTopology: true ,useFindAndModify: false });

const itemSchema = {
  name: String
};
const Item = mongoose.model("Item", itemSchema);
//we are creating the collection called item using the schema we made, which will show the outline of the collection
//these are the actual tasks that need to get done



const item1 = new Item({
  name: "Welcome"
});
//new item within the collection

const item2 = new Item({
  name: "Hit the + to add"
});
//new item within the collection
const item3 = new Item({
  name: "You could delete"
});
//new item within the collection

const defaultItems = [item1, item2, item3];
// we basically put the top three items into an array

const listSchema = { // this is a schema or outline for the new List collection
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);//initialize the collection called List, which will follow the list schema set up


app.get("/", function(req, res) {// upon getting a request from the browser set the this off

  Item.find({}, function(err, foundItems){//this will go through all of them in the item collection sees for errors and checks the items that are in the collection
    if(foundItems.length === 0){ //if there isnt any item in the
      Item.insertMany(defaultItems, function(err){// have the collection insert the default items
        if(err){
          console.log(err);
        }
        else{
          console.log("Successfully added defaultItems");
        }
      });
      res.redirect("/");// redirect us back to the "/" where we go back into this same getter function but this time we render the data
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems}); //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^// adds the found items from the collection
    }
  });
});

app.post("/", function(req, res){// this is the post request that occurs when someone hits the plus sign in the browser/ when the form gets submitted

  const itemName = req.body.newItem;  // the new item is stored in the variable "itemName" from the
  const listName = req.body.list;
  const item = new Item({ //new item document is created in the Item collection
    name: itemName
  });
  if(listName === "Today"){
    item.save()//alternative to insertone: inserts into the collection
    res.redirect("/") // redirect to the app.get("/")
  }
  else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item)
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

app.post("/delete", function(req, res){// upon the action of deleting or hitting the checkbox as shown in the list.ejs do this
  const checkedBox = req.body.checkBox; //find the actual input and store it in checkBox variable

  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedBox, function(err){// use the mongoose function to find the checkedBox and remove it from the collection
      if(err){
        console.log(err);
      }
      else{
        console.log("Successfully removed from database upon checking the box");
      }
      res.redirect("/");// send us back to the root and force refresh
    });
  }else{
    List.findOneAndDelete({name: listName},{$pull:{items: {_id : checkedBox}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    });

  }


});

app.get("/:customListName", function(req, res){// lets say they have a custom page such as localhost:3000/mumbo jumbo
  const customListName = _.capitalize(req.params.customListName); // get the custom name from the url
  List.findOne({name: customListName}, function(err,foundList){
    if(!err){
      if(!foundList){
        const list = new List({ //create a document within the collection list that has the metrics name and default items
          name: customListName,
          items: defaultItems
        });
        list.save(); // save the documents
        res.redirect("/" + customListName);
      }
      else{
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
