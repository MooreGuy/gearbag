/*
	Guy Moore 3/2015 - Ifixit ninja test.

	TODO: Figure out how to store id's for tiles.
	TODO: Add pagination.
	TODO: Show placeholder before an image has loaded.
*/

//Categories that will be pulled from the ifixit api.
var categories;

/*
	Request 20 items, this will just be to test adding tiles to the page..
	TODO: Add category hierarchy, so the user doesn't have to go through a list of things.
*/
var getAllCategories = new Request.JSON({
	url: 'https://www.ifixit.com/api/2.0/categories/all',
	onSuccess: function( responseJSON, responseText ) {
		categories = responseJSON;
		//Iterate through the categories and 
		for( var x = 0; x < categories.length; x++ )
		{
			//Create a new category and store the div.
			var categoryDiv = createCategory(categories[x]);
			
			//Get the image for the category and insert it into the previously created category.
			getCategoryImage( categories[x], categoryDiv )
		}
		/*
			TODO: Figure out how ids should be stored before uncommenting this.
			for( var x = 0; x < categories.length; x++ )
			{
				getCategoryImage(categories[x]);
			}
		*/
	},
	onError: function( text, error ) {	
		alert('There was a problem getting the categories.');
	}
});

//TODO: Correct how the id is selected once you figure out what it should be.
/*
	Get an image for the specific category argument.
	
	@param category String the name of the category
*/
var getCategoryImage = function( category, div ) {
	var imageRequest = new Request.JSON({
		url: 'https://www.ifixit.com/api/2.0/categories/' + category,
		onSuccess: function( responseJSON, responseText ) {
			var image = new Element( 'img', {
				src: responseJSON['image']['thumbnail'],
				alt: category,
				class: 'categoryImage'
			});

			//Insert the new image element at the top of the div for the current category.
			image.inject( div, 'top'); 
		},
		onError: function( error ) {
			console.log('Failed to get the image for ' + category );
		}
	}).get();
}
	
/*
	Create a new category and insesrt it into the mainBody.
	
	@return div object for the category.
*/
var createCategory = function( category ) {
	//Create a new div for the category
	var categoryDiv = new Element('div', {
		class: 'category tile',
		id: category, //TODO: Fix what the id should be set to, since it can't contain spaces.
	});

	//This is the text describing what the tile is.
	var categoryTitle = new Element('p', {
		class: 'categoryTitle',
		html: category
	});
	
	//Insert the newly created category into the main body.
	categoryDiv.inject(mainBody);
	//nest the title in its div.
	categoryTitle.inject( categoryDiv );

	return categoryDiv;
}		 

function callback( transaction, result ) {
	console.log( result.rows.item(0) );
}


var gearBagDatabase = function() {
	/*
	HTML5 WebSQL is deprecated :{( and this code didn't open the database.
	var db = new MooSQL({
		dbName: 'gearbag',
		dbVersion:'1.0',
		dbDesc:'Contains info for gearbag.',
		//Estimate size???
		dbSize: 20*100
	})
	db.addEvent('databaseReady', function() {
		//This isn't running.
		console.log('Database is ready.');
		db.exec("select * from 'items'", callback.bindWithEvent());
	})
	db.addEvent('statementError', function( exception ) {
		console.log( exception );
	})
	db.addEvent('notSupported', function() {
		alert('You can\'t save your items because your browser doesn\'t support local storage.');
	})
	db.addEvent('databaseCreated', function() {
		console.log('The database was just created.');
	})
	*/
	

	addItemToGearBag();
	
	console.log('Ran database function.');
	
}

function addItemToGearBag( items ) {

	//MDN says not to do this, prefixed names are buggy.
	//var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

	var db;
	var DBOpenRequest = window.indexedDB.open("gearBag", 1);
	DBOpenRequest.onsuccess = function( event ) {
		db = DBOpenRequest.result;
		var transaction = db.transaction(["items"], "readwrite");
		transaction.onerror = function( event ) {
			console.log( 'error on transaction', event );
		}
		transaction.oncomplete = function( event ) {
			console.log( 'completed transaction', event );
		}
		
		var objectStore = transaction.objectStore("items");
		for( var i in items ) {
			var request = objectStore.add(items[i]);
			request.onsuccess = function( event ) {
				console.log( 'Added an item.', items[i] );
			}
			request.onerror = function( event ) {
				console.log( 'There was an error adding an item.', items[i] );
			}
		}
	}
	DBOpenRequest.onerror = function( event ) {
		console.log('There was an error opening the database', event.target.errorCode);
	}

	//Handle what needs to happen if the database isn't created or is an older version.
	DBOpenRequest.onupgradeneeded = upgradeDatabase;
}

/*
	Handle upgrading the database.
*/
var upgradeDatabase = function( event ) {

	console.log('upgrading the database');

	//Handle upgrading the db or creating it..
	var db = event.target.result;

	//Adding the object store named Items with a key called name.
	var objectStore = db.createObjectStore("items", { keyPath: "name" });

	//Adding an index.
	//objectStore.createIndex("number", "number", { unique: false });
	
	/*
	objectStore.transaction.oncomplete = function( event ) {
		var itemObjectStore = db.transaction("items", "readwrite").objectStore("items");
		for( var i in customerData ) {
			itemObjectStore.add( 
		}
	}
	*/			
}

function getAllGearBagItems() {
}

function deleteGearBagItem() {
}

//Test the request to see if it works.
getAllCategories.get({});	
addItemToGearBag( [{name: "1965-1969 Chevrolet Corvair"}] );
