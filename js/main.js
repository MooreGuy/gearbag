/*
	Guy Moore 3/2015 - Ifixit ninja test.

	TODO: Add pagination.
	TODO: Show placeholder before an image has loaded.
*/



/*
	Request 20 items, either by an offset that increments by 20 every time the function is called, or 
	a custom offset can be set by setting the customOffset argument to a number a positive number.

	@param customOffset null if there is no custom offset and a positive number if it is not.

	TODO: Add category hierarchy, so the user doesn't have to go through a list of things.
*/
function GetCategories() {};


GetCategories.requestOffset = -20;
GetCategories.requestLimit = 20;


/*
	TODO: Comment this method.
*/
GetCategories.all = function( customOffset, callback ) {

	/*
		TODO: Comment this method.
	*/
	GetCategories.requestAll = new Request.JSON( {
		url: 'https://www.ifixit.com/api/2.0/categories/all',
		onSuccess: function( responseJSON, responseText ) {
			//Add the categories to the page as tiles. 
			for( var x = 0; x < responseJSON.length; x++ ) {
				loadItemTile( responseJSON[x] );
			}
			if( typeof callback !== "undefined" && typeof callback !== null ) {
				callback();
			}
		},
		onError: function( text, error ) {	
			alert('There was a problem getting the categories.');
			
			if( callback !== null ) {
				callback(error);
			}
		}
	})

	if( typeof customOffset !== null ) {
		GetCategories.requestOffset += 20;
		GetCategories.requestAll.get( {"offset": GetCategories.requestOffset, "limit": GetCategories.requestLimit });
	}
	else {
		GetCategories.requestAll.get( {"offset": customOffset, "limit": GetCategories.requestLimit });
		GetCategories.requestOffset = customOffset;
	}		
}

//Categories that will be pulled from the ifixit api.
GetCategories.hierarchy = null;

/*
	TODO: Complete this method and comment it.

	@param categoryTokens array of categories in order from the uri tokens.
*/
GetCategories.hierarchical = function( categoryTokens ) {
	console.log('getting hierarchical');

	//TODO: Remove this object that is being binded in produceHierarchyTiles, was just practicing.
	var Category = {
		categories: categoryTokens
	};
	console.log(Category.categories);
	
	//Make sure we've got the hierarchy. If it is null, then request it and then complete the rest of the function.
	if( GetCategories.hierarchy === null ) {	
		GetCategories.requestCategories = new Request.JSON( {
			url: 'https://www.ifixit.com/api/2.0/categories',
			onSuccess: function( ResponseJSON, text ) {
				GetCategories.hierarchy = ResponseJSON;
				console.log(ResponseJSON);
				console.log(GetCategories.hierarchy);
				produceHierarchyTiles.bind(Category);
				produceHierarchyTiles();
			},
			onError: function() {
				console.log( 'There was an error getting the category hierarchy.');
			}
		}).get({});
	}
	//TODO: Wrap else in its own function so it can be used in the onSuccess callback of the JSON Request.
	else {
		produceHierarchyTiles.bind(Category)();
		
	}

}


/*
	Obtains the current object by stepping through the trail of uri tokens to the desired object.
	Then produces a string name for each child category of our currentWorkingCategory. Next, loads
	the tiles and a the breadcrumb.

	@param array categories the category trail from the uri tokens. 
*/
function produceHierarchyTiles() {
	console.log(this.categories);

	//Get the desired category in the hierarchy and produce its tiles and breadcrumb.
	var currentWorkingCategory = GetCategories.getCategoryInHierarchy( this.categories );
		

	//Get a list of string category names instead of objects from the currentWorkingCategory.
	var categoryNames = [];
	for( var category in currentWorkingCategory ) {
		categoryNames.push(category);
	}

	//TODO: Produce tiles
	loadTiles( categoryNames )
	//TODO: Produce breadcrumb.
}


/*
	Returns the object of the very last category name in categories by stepping,
	through the hierarchy object.
	
	@param string array categories which is the list breadcumbs for the categories.
	the last category name will be the object returned.
*/
GetCategories.getCategoryInHierarchy = function( categories ) {

	var currentCategoryObject = GetCategories.hierarchy;

	//If there are no uri tokens just get the root category.
	if( typeof categories === "undefined" ) {
		
		return currentCategoryObject;
	}
	for( var i = 1; i < categories.length; i++ ) {
		currentCategoryObject = currentCategoryObject[categories[x]];
	}

}




/*
	Checks if this item is already in the gearbag before adding it. If it is it
	takes in a name and creates a tile for it. Then injects it into the mainBody.
	Next the image is retrieved.
	
	@param categories string name of the category.
*/	
function loadItemTile( category ) {
		
	var callback = function( error, inGearBag ) {

		if( error ) {
			console.log('There was an error checking the gearbag.');
		}
		else if( !inGearBag ) {
			//Create a new category and store the div.
			var categoryDiv = createCategory(category);

			createPlaceHolder( categoryDiv );

			//Get the image for the category and insert it into the previously created category.
			getCategoryImage( category, categoryDiv );
		}	
	}

	//Check the gearbag, if successful it will run the callback function.
	checkGearBagItems( category, callback );
}


/*
	Create a placeholder image that is loaded before the actual image is.
*/
function createPlaceHolder( categoryDiv ) {

	var image = new Element( 'img', {
		src: 'img/item.svg',
		alt: 'Item',
		class: 'categoryImage placeHolder',
		draggable: 'false' //Don't allow just the image to be dragged.
	});

	image.inject(categoryDiv, 'top');

}


/*
	Dispose of the placeholder image.
*/
function removePlaceHolder( categoryDiv  ) {
	
	var selector = '.placeHolder';
	var placeHolderImage = categoryDiv.getChildren( selector );
	placeHolderImage.dispose();
}


/*
	Takes in a name and creates a tile for it. Then injects it into
	the mainBody. Next the image is retrieved.
	
	@param categories string name of the category.
*/	
function loadTiles( categories ) {

	for( var x = 0; x < categories.length; x++ )
	{
		//Create a new category and store the div.
		var categoryDiv = createCategory(categories[x]);

		createPlaceHolder( categoryDiv );

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
			try {
				imageSource = responseJSON['image']['medium'];
				if( typeof imageSource !== "undefined" ) {

					removePlaceHolder(div);

					var image = new Element( 'img', {
						src: imageSource,
						alt: category,
						class: 'categoryImage',
						draggable: 'false' //Don't allow just the image to be dragged.
					});

					//Insert the new image element at the top of the div for the current
					//category.
					image.inject( div, 'top'); 
				}
			}
			catch( error ) { 
				//console.log('No image for ' + category, error );
			}
				
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
		
	//fade the element back in since it was faded it out and we need it again.
	var draggingElement = $$('div.dragging')[0];

	//Check to make sure the element being dragged wasn't disposed of. Like when added to the
	//gearbag.
	if( typeof draggingElement !== "undefined" ) {	
		draggingElement.removeClass('dragging');
		draggingElement.fade('in');
	}

}


/*
	Add a single item to the gearbag.
	
	@param item object is an object with a name property that associates with the name of
	the item being added.
*/
function addItemToGearBag( item ) {

	//MDN says not to do this, prefixed names are buggy. Possible that these don't use standards.
	//var indexedDB = window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

	var db;
	var DBOpenRequest = window.indexedDB.open("gearBag", 1);
	DBOpenRequest.onsuccess = function( event ) {
		db = DBOpenRequest.result;
		var transaction = db.transaction("items", "readwrite");
		transaction.onerror = function( event ) {
			console.log( 'error on transaction', transaction.error );
		}
		transaction.oncomplete = function( event ) {
		}
		
		var objectStore = transaction.objectStore("items");
		var request = objectStore.add(item);
		request.onsuccess = function( event ) {
		}
		request.onerror = function( event ) {
			console.log( 'There was an error adding an item.', items[i], request.error );
		}
	}
	DBOpenRequest.onerror = function( event ) {
		console.log('There was an error opening the gear bag', request.error );
	}

	//Handle what needs to happen if the database isn't created or is an older version.
	DBOpenRequest.onupgradeneeded = upgradeDatabase;
}


/*
	Handle upgrading, or instantiating the datbase.

	@paramater the event from the onupgradeneeded event.
*/
function upgradeDatabase( event ) {


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
			callback( transaction.error );
		}
		transaction.oncomplete = function( event ) {
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
			}
		}
	}
	//Set how the database should be upgraded or instantiated.
	DBOpenRequest.onupgradeneeded = upgradeDatabase;		
}


/*
	Delete an item from the gear bag.
		
	@param item object with the name property associated with the name of the item being deleted.
*/
var deleteGearBagItem = function( item ) {
	//The database is set after a successful open request is ran.
	var db;

	var DBOpenRequest = window.indexedDB.open("gearBag", 1);
	DBOpenRequest.onsuccess = function( event ) {
		db = DBOpenRequest.result;
		var transaction = db.transaction(["items"], "readwrite");

		transaction.onerror = function( event ) {
			console.log( transaction.error );
		}
		transaction.oncomplete = function( event ) {
		}
		

		var objectStore = transaction.objectStore("items");

		var request = objectStore.delete(item);
		request.onsuccess = function() {
		}
		request.onerror = function() {
			console.log( 'Failed to remove an item from the gear bag.', request.error );
		}

	}
	DBOpenRequest.onerror = function( event ) {
		console.log( 'error opening the gear bag', DBOpenRequest.error );
	}
	DBOpenRequest.oncomplete = function( event ) {
	}
}


/* 

	@param an array of items that should be checked whether or not they are in the database.
	
	@param callback has two parameters an error if there was an error, and then a boolean
	either true or false. True if the item was found, and false if it wasn't.

*/
function checkGearBagItems( item, callback ) {	
	//The database is set after a successful open request is ran.
	var db;

	var DBOpenRequest = window.indexedDB.open("gearBag", 1);
	DBOpenRequest.onsuccess = function( event ) {
		db = DBOpenRequest.result;
		
		var transaction = db.transaction(["items"], "readwrite");	
		var objectStore = transaction.objectStore("items");
		
		var request = objectStore.get( item );

		request.onsuccess = function( event ) {
			if( typeof request.result !== "undefined" && typeof request.result.name !== "undefined" )
			{
				callback(null, true);
			}
			else
			{
				//not sure if this stops the function this function is nested in.
				return callback(null, false);
			}
		}
		request.onerror = function( event ) {
			return callback( request.error );
		}

		transaction.oncomplete = function( event ) { 
		}
		transaction.onerror = function( event ) {
			return callback( transaction.error );
		}

	}

	DBOpenRequest.onerror = function( event ) {
		console.log( 'error opening the gear bag', DBOpenRequest.error );
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
}


/*
	Handle what should happen when the user drops and item on the delete
	cross

	First get the data from the drop event, then delete it from the database.
	Then we have to prevent the default action from occurring on drops.
*/
function handleDeleteDrop( event ) {
	
	var data = event.dataTransfer.getData("text/plain");
	
	deleteGearBagItem( data );

	//Remove the element that was being dragged.
	var draggingElement = $$('div.dragging')[0];
	draggingElement.dispose();

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

			console.log(draggingElement);
		}
		else {
			var itemObject = { name: data };
			addItemToGearBag( itemObject );
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
*/
function InfiniteScrolling() {};
InfiniteScrolling.loading = false;;

InfiniteScrolling.onScroll = function() {

	var loadingCallback = function() {
		InfiniteScrolling.loading = false;
	}

	var scrollSize = $(window).getScrollSize();
	var scrolled = $(window).getScroll();
	
	//console.log( scrolled.y );
	//console.log( scrollSize.y );
	if( scrolled.y >= scrollSize.y - 1200 ) {
		if( InfiniteScrolling.loading === false ) {
			GetCategories.all( null, loadingCallback );
			InfiniteScrolling.loading = true;
		}
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
			GetCategories.all( 0 );	
			setDropArea(handleGearBagDrop);
			window.addEventListener( 'scroll', InfiniteScrolling.onScroll );
		}
		if( uriTokens[1] === "categories" ) {
			clearTiles();
			clearItemControls();
			createGearBagControl();
			setDropArea(handleGearBagDrop);

			for( var i = 2; i < uriTokens.length; i++ ) {
				//TODO: Create breadcrumbs
			}

			//TODO: Populate categories.
			//TODO: Load categories in a hierarchical manner. When no parameter is specified then load root category list.
			if( uriTokens.length === 2 ) {
				GetCategories.hierarchical(); 
			}
			else {
				//TODO: Get the categories within the category specified in the last uri token.

				//Create an array of the current category hierarchy. Remove the first two elements that are just directing to the hierarchical view.
				var categoryArray = uriTokens.split(2);
				GetCategories.hierarchical( categoryArray );
			}
			
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
		window.removeEventListener( 'scroll', InfiniteScrolling.onScroll );

	}

	//If there is nothing recognized. Default to items.
	else {	
		clearTiles();
		clearItemControls();
		createGearBagControl();
		GetCategories.all( 0 );	
		setDropArea(handleGearBagDrop);
		window.addEventListener( 'scroll', InfiniteScrolling.onScroll );
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
