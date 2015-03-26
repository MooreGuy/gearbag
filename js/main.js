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
			createCategory(categories[x]);
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
//Get an image for the specific category argument.
var getCategoryImage = function( category ) {
	var imageRequest = new Request.JSON({
		url: 'https://www.ifixit.com/api/2.0/categories/' + category,
		onSuccess: function( responseJSON, responseText ) {
			var image = new Element( 'img', {
				src: responseJSON['image']['thumbnail'],
				alt: category,
				id: category + 'image'
			});
			console.log($(category));
			//Insert the new image element at the top of the div for the current category.
			//image.inject( $(category), 'top'); 
		},
		onError: function( error ) {
			console.log('Failed to get the image for ' + category );
		}
	}).get();
}
	
//Create a new category and insesrt it into the mainBody.
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
}		 

//Test the request to see if it works.
getAllCategories.get({});	

