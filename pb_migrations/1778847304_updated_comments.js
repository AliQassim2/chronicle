/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_533777971")

  // add field
  collection.fields.addAt(7, new Field({
    "help": "",
    "hidden": false,
    "id": "file3760176746",
    "maxSelect": 5,
    "maxSize": 10485760,
    "mimeTypes": [
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/webp"
    ],
    "name": "images",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": null,
    "type": "file"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_533777971")

  // remove field
  collection.fields.removeById("file3760176746")

  return app.save(collection)
})
