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

function addItemToGearBag( items ) {

	//MDN says not to do this, prefixed names are buggy. Possible that these don't use standards.
	//var indexedDB = window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

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
		console.log('There was an error opening the gear bag', event.target.errorCode);
	}

	//Handle what needs to happen if the database isn't created or is an older version.
	DBOpenRequest.onupgradeneeded = upgradeDatabase;
}

/*
	Handle upgrading, or instantiating the datbase.

	@paramater the event from the onupgradeneeded event.
*/
var upgradeDatabase = function( event ) {

	console.log('upgrading the database');

	//Handle upgrading the db or creating it..
	var db = event.target.result;

	//Adding the object store named Items with a key called name.
	var objectStore = db.createObjectStore("items", { keyPath: "name" });

	//Adding an index for the quantity of items.
	//objectStore.createIndex("number", "number", { unique: false });
}

/*
	Retrieve all of the gear bag items.
	
	@parameter callback function first paramter error, second parameter
*/
function getAllGearBagItems( callback ) {	

	//The database is set after a successful open request is ran.
	var db;

	//Create the request to open the gear bag.
	var DBOpenRequest = window.indexedDB.open("gearBag", 1);
	DBOpenRequest.onsuccess = function( event ) {
		db = DBOpenRequest.result;
		var transaction = db.transaction(["items"], "readwrite");
		transaction.onerror = function( event ) {
			console.log( 'error on transaction', event.target.errorCode );
			callback( event.result );
		}
		transaction.oncomplete = function( event ) {
			console.log( 'completed transaction', event );
		}
		
		var objectStore = transaction.objectStore("items");
			
		//Array of all the items.
		var items = [];
		objectStore.openCursor().onsuccess = function( event ) {
			var cursor = event.target.result;
			if( cursor ) {
				items.push(cursor.value);
				cursor.continue();
			}
			else
			{
				callback( Null, items );
				console.log(items, 'here is everything in the database.');
			}
		}
	}
	//Set how the database should be upgraded or instantiated.
	DBOpenRequest.onupgradeneeded = upgradeDatabase;		
}

/*
	Delete all items listen in the items array argument.
*/
var deleteGearBagItems = function( items ) {
	//The database is set after a successful open request is ran.
	var db;

	var DBOpenRequest = window.indexedDB.open("gearBag", 1);
	DBOpenRequest.onsuccess = function( event ) {
		db = DBOpenRequest.result
		var transaction = db.transaction(["items"], "readwrite");
		transaction.onerror = function( event ) {
			console.log( 'error on transaction', event.target.errorCode );
		}
		transaction.oncomplete = function( event ) {
			console.log( 'completed transaction', event );
		}
		
		var objectStore = transaction.objectStore("items");

		for( var i in items )
		{
			var request = objectStore.delete(items[i]);
			request.onsuccess = function() {
				console.log('Removed an item from the gear bag.', items[i] );
			}
			request.onerror = function() {
				console.log( 'Failed to remove an item from the gear bag.', event.target.errorCode );
			}
		}	
	}
	DBOpenRequest.onerror = function( event ) {
		console.log( 'error opening the gear bag', event.target.errorCode );
	}
	DBOpenRequest.oncomplete = function( event ) {
		console.log( 'completed ', event );
	}
}

//Test the request to see if it works.
getAllCategories.get({});	
//addItemToGearBag( [{name: "1965-1969 Chevrolet Corvair"}] );
//deleteGearBagItems( ["1965-1969 Chevrolet Corvair"] );
