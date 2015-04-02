/*
	Guy Moore 3/2015 - Ifixit ninja test.

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
		//Add the categories to the page as tiles. 
		loadTiles( responseJSON );
	},
	onError: function( text, error ) {	
		alert('There was a problem getting the categories.');
	}
});


/*
	Takes in an array of names and creates a tile for each then injects it into
	the mainBody.
	
	@param categories an array of names for categories or items.
*/	
function loadTiles( categories ) {
	for( var x = 0; x < categories.length; x++ ) {

		//Create a new category and store the div.
		var categoryDiv = createCategory(categories[x]);
	
		//Get the image for the category and insert it into the previously created category.
		getCategoryImage( categories[x], categoryDiv )
	}
}


/*
	Create the callback which is like a node.js callback, where first it takes an error if 
	there is any, then an array of items names.

	If there is no error from getAllGearBagItems, then load the tiles into the mainBody.
*/
function loadGearBagItems() {
	var callback = function( error, itemNames ) {
		if( error ) {
			console.log('There was an error getting the items.');
		}
		else {
			loadTiles( itemNames );
		}
	}	

	getAllGearBagItems( callback );
}


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
		draggable: 'true'
		//ondragstart: onDragStart
	});

	//This doesn't work? I don't know why this doesn't work. TODO: Ask iFixit why this doesn't work.
	//If I had to guess, it is because it doesn't see any valid drop targets.
	//NOPE the other method will work without valid drop targets, so this should too.
	/*
	//The events that happen when dragging starts.
	categoryDiv.addEvent('dragstart', function( event ) {
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
		categoryDiv.addClass('dragging');
		categoryDiv.fade('out');
	}

	function handleDragEnd( event ) {
		//Prevent the default action.
		event.preventDefault();
			
		console.log( event.dataTransfer.getData('text/plain'));
		
		/*
		if( event.dataTransfer.getData('text/plain') !== null ) {
			categoryDiv.fade('in');
		}
		*/
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


/*
	Add an array of items to the gear bag.
*/
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
	
	@parameter callback function like node.js, first paramter will be an error if any was thrown,
	and the second parameter is an array of items if there were no errors.
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
				//Get the name of the stored object.
				items.push(cursor.value['name']);
				cursor.continue();
			}
			else
			{
				callback( null, items );
				console.log(items, 'here is everything in the database.');
			}
		}
	}
	//Set how the database should be upgraded or instantiated.
	DBOpenRequest.onupgradeneeded = upgradeDatabase;		
}


/*
	Delete all items listed in the items array argument.
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
		db = DBOpenRequest.result;
		
		var transaction = db.transaction(["items"], "readwrite");	
		var objectStore = transaction.objectStore("items");
		
		for( var i = 0; i < items.length; i++ ) {
			
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

	@param dropFunction a function handling what should happen when an item is dropped on the
	drop area.
*/
var setDropArea = function( dropFunction ) {
	var dropArea = $$('div.dropArea')[0];
	
	/*
		You must prevent the default behavior on both dragenter and dragover
		according to the MDN guide on drag and drop.

		Do not use Mootools to add events because they are not working for some reason..
	*/
	dropArea.addEventListener('drop', dropFunction, false);
	dropArea.addEventListener('dragenter', handleDragEnter, false);
	dropArea.addEventListener('dragover', handleDragOver, false);
	dropArea.addEventListener('dragleave', handleDragLeave, false);

	console.log('setting drop area.', dropArea, dropFunction );
}


function handleDeleteDrop( event ) {
	
	var data = event.dataTransfer.getData("text/plain");
	
	deleteGearBagItems( [data] );

	event.preventDefault();
}


/*
	Handle what should happen when the user drops an item on the gear bag.
*/
var handleGearBagDrop = function( event ) {

	//Get the data from the drop event.
	var data = event.dataTransfer.getData("text/plain");
	var draggingElement = $$('div.dragging')[0];

	var handleDropCallback = function( inGearBag ) {
		if( inGearBag ) {
			//TODO: Add message to tell the user that the item they dropped is already in the gearbag.

			//fade the element back in since it was faded it out and we need it again.
			draggingElement.removeClass('dragging');
			draggingElement.fade('in');
			console.log(draggingElement);
		}
		else {
			var itemObject = { name: data };
			addItemsToGearBag( [itemObject] );
			draggingElement.dispose();
			

		}
	}
	checkGearBagItems( [data], handleDropCallback );
	

	//TODO: Check if the dropped item is already in the database.
	//TODO: If the item is not in the database then add it.
	//Prevent the browser from handling the drop in case it decides to do something browsery.
	event.preventDefault();
}

	
/*
	Decide what should be done when the cursor scrolls over a drop area while dragging
	an item.
*/
function handleDragEnter( event ) {
	event.preventDefault();
	//TODO: Highlight the droppable or something schnazzy.
	//TODO: Only highlight when there is something that should be dropped.
}


/*
	Drag leave will be called even on the drag being cancelled so you can be	
	sure that it can do cleanup.
*/
function handleDragLeave( event ) {

	//TODO: Remove hilighting and schnazz.
	//Always remove hilighting, and don't check if it is a valid drop target, because even if it
	//wasn't then it should still be removed.
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


/*
	Handle what happens when the user drags an item over a drop area.
*/
function handleDragOver( event ) {

	//The default is to not do anything, but if the drag contains plain text, then allow the drop.
	var isPlainText = contains( event.dataTransfer.types, "text/plain" )

	if( isPlainText )
	{
		//Prevent the default only if they are dragging something that has data that is plain
		//text. Otherwise they might drag random elements into the gear bag.
		event.preventDefault();
	}
}


/*
	Handle routing of pages get the items after the hash and use a regular expression
	to filter out the hash and split up the uri in to chunks divided by backslashes.
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

	/*
		Simple routing, the application is really small, only 2 pages and one that has two
		different options for displaying its items. So this works just fine.
	*/
	if( uriTokens[0] === "items" ) {
		
		if( uriTokens[1] === "all" ) {
			clearTiles();
			clearItemControls();
			createGearBagControl();
			getAllCategories.get({});	
			setDropArea(handleGearBagDrop);
		}
		if( uriTokens[1] === "categories" ) {
			clearTiles();
			clearItemControls();
			createGearBagControl();
			//getCategories()  TODO: Load categories in a hierarchical manner.
			setDropArea(handleGearBagDrop);
		}
	}
	else if( uriTokens[0] === "gearbag" ) {
		//TODO: Create the delete div and image.
		//TODO: get all items from the gearbag.
		//TODO: set the drop area and tell the delete div how to handle drops.

		clearTiles();
		clearItemControls();
		createDeleteButton();
		loadGearBagItems();
		setDropArea(handleDeleteDrop);

	}

	//If there is nothing recognized. Default to items.
	else {	
		clearTiles();
		clearItemControls();
		createGearBagControl();
		getAllCategories.get({});	
		setDropArea(handleGearBagDrop);
	}
}


/*
	Destroy all of the tiles that are in the main body.
*/
function clearTiles() {
	var tiles = $('mainBody').getChildren();
	
	for( var x = 0; x < tiles.length; x++ ) {
		tiles[x].destroy();
	}	
}


/*
	Destroy all the control buttons and dorp areas in the itemControls bar.
*/
function clearItemControls() {
	var controls = $('itemControls').getChildren();

	for( var x = 0; x < controls.length; x++ ) {
		controls[x].destroy();
	}
}


/*
	Create the elements for the gearbag.

	Creates the gear bag div element inject it into the sidebar. Next, add
	the gear bag image and inject it into the gear bag div.
*/
function createGearBagControl() {
	var gearBag = new Element( 'div', {
		class: 'dropArea sideBarElement'
	})

	gearBag.inject( itemControls );

	var gearBagImage = new Element( 'img', {
		src: 'img/bag.svg',
		alt: 'Gear Bag',
		class: 'sideBarImage dropArea'
	})

	gearBagImage.inject( gearBag );
}


/*
	Create the elements for the delete button.
*/
function createDeleteButton() {
	var deleteButton = new Element( 'div', {
		class: 'dropArea sideBarElement'
	})
	
	deleteButton.inject( itemControls );

	var deleteImage = new Element( 'img', {
		src: 'img/cross.svg',
		alt: 'Delete Button',
		class: 'sideBarImage'
	})

	deleteImage.inject( deleteButton );
}




window.addEventListener( 'hashchange', handleHashChange )
window.addEventListener( 'load', handleHashChange )

//addItemToGearBag( [{name: "1965-1969 Chevrolet Corvair"}] );
//deleteGearBagItems( ["1965-1969 Chevrolet Corvair"] );
