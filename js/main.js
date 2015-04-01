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

			//Check to make sure that there is an image, if not set placeholder.
			var imageSource;
			if( responseJSON['image'] !== null && responseJSON['image']['medium'] !== null ) {
				imageSource = responseJSON['image']['medium'];
			}
			else {
				//TODO: Add placeholder image for items that don't have an image.
				imageSource = "img/cross.svg"; 
			}
				
			var image = new Element( 'img', {
				src: imageSource,
				alt: category,
				class: 'categoryImage',
				draggable: 'false' //Don't allow just the image to be dragged.
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

	//
	var onDragStart = 'event.dataTransfer.setData(\'text/plain\', \'' + category + '\')';

	//Create a new div for the category
	var categoryDiv = new Element('div', {
		class: 'category tile',
		id: category, //TODO: Fix what the id should be set to, since it can't contain spaces.
		draggable: 'true'
		//ondragstart: onDragStart
	});

	//This doesn't work? I don't know why this doesn't work. TODO: Ask iFixit why this doesn't work.
	//If I had to guess, it is because it doesn't see any valid drop targets.
	//NOPE the other method will work without valid drop targets, so this should too.
	/*
	//The events that happen when dragging starts.
	categoryDiv.addEvent('dragstart', function( event ) {
		console.log('started drag event.');
		event.dataTransfer.setData('text/plain', category);
		event.dataTransfer.effectAllowed = "copy";
		//Set the drag image for the cursor.
		//event.dataTransfer.setDragImage( image, xOffset, yOffset);
	})
	*/

	//Do everything vanilla because mootools doesn't work for this. Why do you make me sad Mootools :(
	categoryDiv.addEventListener('dragstart', handleDragStart, false);
	categoryDiv.addEventListener('dragend', handleDragEnd, false);

	//Nest the drag start event handler so we can set the category as the transfer data for the drag,
	//otherwise we would not be able to pass data when dragging.
	function handleDragStart( event ) {
		//Set the data type so this will work in firefox.
		event.dataTransfer.setData('text/plain', category)
	}


	//This is the text describing what the tile is, it is the lower title of the tile.
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

function handleDragEnd( event ) {
	//Prevent the default action.
	event.preventDefault();
}

function addItemsToGearBag( items ) {

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
			console.log(items[i]);
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
function upgradeDatabase( event ) {

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
		db = DBOpenRequest.result;
		var transaction = db.transaction(["items"], "readwrite");
		transaction.onerror = function( event ) {
			console.log( 'error on transaction', event.target.errorCode );
		}
		transaction.oncomplete = function( event ) {
			console.log( 'completed transaction', event );
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
		

	}
	DBOpenRequest.onerror = function( event ) {
		console.log( 'error opening the gear bag', event.target.errorCode );
	}
	DBOpenRequest.oncomplete = function( event ) {
		console.log( 'completed ', event );
	}
}

/* 

	@param an array of items that should be checked whether or not they are in the database.
	
	@param callback has one parameter either true or false. True if the item was found, and false if it wasn't.
	The callback function should count how many times it is given the result true, if it returns for every single
	item passed, then everything thing is there, but if it returns false, then something is not there.

*/
function checkGearBagItems( items, callback ) {	
	//The database is set after a successful open request is ran.
	var db;

	var DBOpenRequest = window.indexedDB.open("gearBag", 1);
	DBOpenRequest.onsuccess = function( event ) {
		console.log('maybe in here.');
		db = DBOpenRequest.result;
		
		var transaction = db.transaction(["items"], "readwrite");	
		var objectStore = transaction.objectStore("items");
		
		for( var i = 0; i < items.length; i++ ) {
			console.log( 'checking', items[i] );
			
			var request = objectStore.get( items[i] );

			request.onsuccess = function( event ) {
				if( typeof request.result !== "undefined" && typeof request.result.name !== "undefined" )
				{
					callback(true);
				}
				else
				{
					//not sure if this stops the function this function is nested in.
					return callback(false);
				}
			}
			request.onerror = function( event ) {
				console.log( 'couldn\'t check for an item', event.target.errorCode );
			}
		}
		transaction.oncomplete = function( event ) { 
			console.log('completed transaction', event );
		}
		transaction.onerror = function( event ) {
			console.log('Failed to start transaction with items.', event );
		}


	}

	DBOpenRequest.onerror = function( event ) {
		console.log( 'error opening the gear bag', event.target.errorCode );
	}

	DBOpenRequest.onupgradeneeded = upgradeDatabase;
}

/*
	Clear the default of doing absolutely nothing on drops for the droppables to declare
	the dropArea class element as an allowed drop area. Add special hilighting classes
	to the drop area when a drop enters the drop area.
*/
var setDropArea = function() {
	var dropArea = $$('div.dropArea')[0];
	
	/*
		You must prevent the default behavior on both dragenter and dragover
		according to the MDN guide on drag and drop.

		Do not use Mootools to add events because they are not working for some reason..
	*/
	dropArea.addEventListener('drop', handleGearBagDrop, false);
	dropArea.addEventListener('dragenter', handleDragEnter, false);
	dropArea.addEventListener('dragover', handleDragOver, false);
	dropArea.addEventListener('dragleave', handleDragLeave, false);

}

function handleGearBagDrop( event ) {

	//Get the data from the drop event.
	var data = event.dataTransfer.getData("text/plain");

	var handleDropCallback = function( inGearBag ) {
		console.log( 'Is it in the gearbag?', inGearBag );
		if( inGearBag ) {
			console.log( 'The item is already in the gear bag.');
			//TODO: Add message to tell the user that the item they dropped is already in the gearbag.
		}
		else {
			var itemObject = { name: data };
			addItemsToGearBag( [itemObject] );
		}
	}
	checkGearBagItems( [data], handleDropCallback );
	
	console.log( 'Checking for :', data );

	//TODO: Check if the dropped item is already in the database.
	//TODO: If the item is not in the database then add it.
	//Prevent the browser from handling the drop in case it decides to do something browsery.
	event.preventDefault();
}

	

function handleDragEnter( event ) {
	console.log('handleDragEnter');
	event.preventDefault();
	//TODO: Highlight the droppable or something schnazzy.
}

/*
	Iterate through the list provided to see if it contains at least one type that is equal to the value.
*/
function contains( list, value ) {
	
	for( var i = 0; i < list.length; i++ )
	{
		if( list[i] === value )
		{
			return true;
		}
	}

	return false
}

function handleDragOver( event ) {

	//The default is to not do anything, but if the drag contains plain text, then allow the drop.
	var isPlainText = contains( event.dataTransfer.types, "text/plain" )

	if( isPlainText )
	{
		console.log('DOING THE THING YOU SAID');
		event.preventDefault();
	}
}

/*
	Drag leave will be called even on the drag being cancelled so you can be	
	sure that it can do cleanup.
*/
function handleDragLeave( event ) {
	//TODO: Remove hilighting and schnazz.
	console.log('handleDragLeave');
}

/*
	Handle routing of pages.
*/
function handleHashChange() {

	//This is the changed uri after the hash.
	uri = location.hash;

	//The regular expression to ignore the hash and all backslashes.
	var regex = /[^\/^#]+/g;

	//Temporarily store matches.
	var matched = null;

	//Array of matches.
	var uriTokens = [];
	while( matched = regex.exec(uri) ) {
		uriTokens.push(matched[0]);
	}

	
	console.log( uriTokens[0] );
	console.log( uriTokens[1] );
	if( uriTokens[0] === "gearbag" ) {
		
		if( uriTokens[1] === "all" ) {
			getAllCategories.get({});	
		}
	}
}

window.onhashchange = handleHashChange;



setDropArea();
//addItemToGearBag( [{name: "1965-1969 Chevrolet Corvair"}] );
//deleteGearBagItems( ["1965-1969 Chevrolet Corvair"] );
