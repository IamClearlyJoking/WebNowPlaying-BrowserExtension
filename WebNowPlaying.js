var currTitle;
var currArtist;
var currAlbum;
var currCover;
var currPos;
var currDur;
var currVolume;
var currRating;
var currRepeat;
var currShuffle;
var currState;

//Always make sure this is set
var currPlayer;

//Only set if the Rainmeter plugin will need to do extra cleanup with an external API
//NOTE: Doing this will require a plugin update and will have to be approved first
var currTrackID;
var currArtistID;
var currAlbumID;

var ws;
var connected = false;
var reconnect;
var sendData;

var musicEvents;
var musicInfo;

/*
██   ██ ███████ ██      ██████  ███████ ██████  ███████
██   ██ ██      ██      ██   ██ ██      ██   ██ ██
███████ █████   ██      ██████  █████   ██████  ███████
██   ██ ██      ██      ██      ██      ██   ██      ██
██   ██ ███████ ███████ ██      ███████ ██   ██ ███████
*/

function pad(number, length)
{
	var str = number + "";
	while (str.length < length)
	{
		str = "0" + str;
	}
	return str;
}

function convertTimeToString(timeInSeconds)
{
	return parseInt(timeInSeconds / 60) + ":" + pad(parseInt(timeInSeconds % 60), 2);
}

/*
███████ ███████ ████████ ██    ██ ██████
██      ██         ██    ██    ██ ██   ██
███████ █████      ██    ██    ██ ██████
     ██ ██         ██    ██    ██ ██
███████ ███████    ██     ██████  ██
*/

function init()
{
	try
	{
		//@TODO allow custom ports
		var url = "ws://127.0.0.1:8974/";
		ws = new WebSocket(url);
		ws.onopen = onOpen;
		ws.onclose = onClose;
		ws.onmessage = onMessage;
		ws.onerror = onError;

		currPlayer = null;

		currTitle = null;
		currArtist = null;
		currAlbum = null;
		currCover = null;
		currPos = null;
		currDur = null;
		currVolume = null;
		currRating = null;
		currRepeat = null;
		currShuffle = null;
		currState = null;

		currTrackID = null;
		currArtistID = null;
		currAlbumID = null;
	}
	catch (error)
	{
		console.log("Error:" + error);
	}
}

var onOpen = function()
{
	connected = true;
	currPlayer = musicInfo.player();
	ws.send("PLAYER:" + currPlayer);
	//@TODO Possibly send all know data right away on open
	sendData = setInterval(function()
	{
		updateInfo();
	}, 50);
};

var onClose = function()
{
	connected = false;
	clearInterval(sendData);
	reconnect = setTimeout(function()
	{
		init();
	}, 5000);
};

var onMessage = function(event)
{
	try
	{
		fireEvent(event);
	}
	catch (e)
	{
		ws.send("Error:" + e);
		throw e;
	}
};

var onError = function(event)
{
	if (typeof event.data != 'undefined')
	{
		console.log("Websocket Error:" + event.data);
	}
};

window.onbeforeunload = function()
{
	ws.onclose = function() {}; // disable onclose handler first
	ws.close()
};


/*
 ██████  ██████       ██ ███████  ██████ ████████ ███████
██    ██ ██   ██      ██ ██      ██         ██    ██
██    ██ ██████       ██ █████   ██         ██    ███████
██    ██ ██   ██ ██   ██ ██      ██         ██         ██
 ██████  ██████   █████  ███████  ██████    ██    ███████
*/

//@TODO Maybe add the ability to pass an already made object
//Use this object to define custom event logic
function createNewMusicEventHandler()
{
	musicEvents = {};

	musicEvents.readyCheck = null;

	musicEvents.playpause = null;
	musicEvents.next = null;
	musicEvents.previous = null;
	musicEvents.progress = null;
	musicEvents.progressSeconds = null;
	musicEvents.volume = null;
	musicEvents.repeat = null;
	musicEvents.shuffle = null;
	musicEvents.toggleThumbsUp = null;
	musicEvents.toggleThumbsDown = null;
	musicEvents.rating = null;

	return musicEvents;
}

//Use this object to define custom logic to retrive data
function createNewMusicInfo()
{
	musicInfo = {};

	//Mandatory, just give the player name
	musicInfo.player = null;
	//Check player is ready to start doing info checks. ie. it is fully loaded and has the song title
	//While false no other info checks will be called
	musicInfo.readyCheck = null;

	musicInfo.state = null;
	musicInfo.title = null;
	musicInfo.artist = null;
	musicInfo.album = null;
	musicInfo.cover = null;
	musicInfo.duration = null;
	musicInfo.position = null;
	musicInfo.durationString = null;
	musicInfo.positionString = null;
	musicInfo.volume = null;
	musicInfo.rating = null;
	musicInfo.repeat = null;
	musicInfo.shuffle = null;

	//Optional, only use if more data parsing needed in the Rainmeter plugin
	musicInfo.trackID = null;
	musicInfo.artistID = null;
	musicInfo.albumID = null;

	//@TODO Make it possible to define custom update rates?
	//@TODO Event based updating?

	return musicInfo;
}

/*
██ ███    ██ ███████  ██████      ██    ██ ██████  ██████   █████  ████████ ███████ ██████
██ ████   ██ ██      ██    ██     ██    ██ ██   ██ ██   ██ ██   ██    ██    ██      ██   ██
██ ██ ██  ██ █████   ██    ██     ██    ██ ██████  ██   ██ ███████    ██    █████   ██████
██ ██  ██ ██ ██      ██    ██     ██    ██ ██      ██   ██ ██   ██    ██    ██      ██   ██
██ ██   ████ ██       ██████       ██████  ██      ██████  ██   ██    ██    ███████ ██   ██
*/
function updateInfo()
{
	//Try catch for each updater to make sure info is fail safe
	//This would be a lot cleaner if javascript had nice things like enums, then I could just foreach this
	//UPDATE STATE
	if (musicInfo.readyCheck === null || musicInfo.readyCheck())
	{
		var temp;
		try
		{
			if (musicInfo.state !== null)
			{
				temp = musicInfo.state();
				if (currState !== temp && temp !== null)
				{
					ws.send("STATE:" + temp);
					currState = temp;
				}
			}
		}
		catch (e)
		{
			ws.send("Error:" + "Error updating state for " + musicInfo.player());
			ws.send("ErrorD:" + e);
		}
		//UPDATE TITLE
		try
		{
			if (musicInfo.title !== null)
			{
				temp = musicInfo.title();
				if (currTitle !== temp && temp !== null)
				{
					ws.send("TITLE:" + temp);
					currTitle = temp;
				}
			}
		}
		catch (e)
		{
			ws.send("Error:" + "Error updating title for " + musicInfo.player());
			ws.send("ErrorD:" + e);
		}
		//UPDATE ARTIST
		try
		{
			if (musicInfo.artist !== null)
			{
				temp = musicInfo.artist();
				if (currArtist !== temp && temp !== null)
				{
					ws.send("ARTIST:" + temp);
					currArtist = temp;
				}
			}
		}
		catch (e)
		{
			ws.send("Error:" + "Error updating artist for " + musicInfo.player());
			ws.send("ErrorD:" + e);
		}
		//UPDATE ALBUM
		try
		{
			if (musicInfo.album !== null)
			{
				temp = musicInfo.album();
				if (currAlbum !== temp && temp !== null)
				{
					ws.send("ALBUM:" + temp);
					currAlbum = temp;
				}
			}
		}
		catch (e)
		{
			ws.send("Error:" + "Error updating album for " + musicInfo.player());
			ws.send("ErrorD:" + e);
		}
		//UPDATE COVER
		try
		{
			if (musicInfo.cover !== null)
			{
				temp = musicInfo.cover();
				if (currCover !== temp && temp !== null)
				{
					ws.send("COVER:" + temp);
					currCover = temp;
				}
			}
		}
		catch (e)
		{
			ws.send("Error:" + "Error updating cover for " + musicInfo.player());
			ws.send("ErrorD:" + e);
		}
		//UPDATE DURATION
		try
		{
			if (musicInfo.durationString !== null)
			{
				temp = musicInfo.durationString();
				if (currDur !== temp && temp !== null)
				{
					ws.send("DURATION:" + temp);
					currDur = temp;
				}
			}
			else if (musicInfo.duration !== null)
			{
				temp = musicInfo.duration();
				if (currDur !== temp && temp !== null && !isNaN(temp))
				{
					ws.send("DURATION:" + convertTimeToString(temp));
					currDur = temp;
				}
			}
		}
		catch (e)
		{
			ws.send("Error:" + "Error updating duration for " + musicInfo.player());
			ws.send("ErrorD:" + e);
		}
		//UPDATE POSITION
		try
		{
			if (musicInfo.positionString !== null)
			{
				temp = musicInfo.positionString();
				if (currPos !== temp && temp !== null)
				{
					ws.send("POSITION:" + temp);
					currPos = temp;
				}
			}
			else if (musicInfo.position !== null)
			{
				temp = musicInfo.position();
				if (currPos !== temp && temp !== null && !isNaN(temp))
				{
					ws.send("POSITION:" + convertTimeToString(temp));
					currPos = temp;
				}
			}
		}
		catch (e)
		{
			ws.send("Error:" + "Error updating position for " + musicInfo.player());
			ws.send("ErrorD:" + e);
		}
		//UPDATE VOLUME
		try
		{
			if (musicInfo.volume !== null)
			{
				temp = parseFloat(musicInfo.volume()) * 100;
				if (currVolume !== temp && temp !== null && !isNaN(temp))
				{
					ws.send("VOLUME:" + temp);
					currVolume = temp;
				}
			}
		}
		catch (e)
		{
			ws.send("Error:" + "Error updating volume for " + musicInfo.player());
			ws.send("ErrorD:" + e);
		}
		//UPDATE RATING
		try
		{
			if (musicInfo.rating !== null)
			{
				temp = musicInfo.rating();
				if (currRating !== temp && temp !== null)
				{
					ws.send("RATING:" + temp);
					currRating = temp;
				}
			}
		}
		catch (e)
		{
			ws.send("Error:" + "Error updating rating for " + musicInfo.player());
			ws.send("ErrorD:" + e);
		}
		//UPDATE REPEAT
		try
		{
			if (musicInfo.repeat !== null)
			{
				temp = musicInfo.repeat();
				if (currRepeat !== temp && temp !== null)
				{
					ws.send("REPEAT:" + temp);
					currRepeat = temp;
				}
			}
		}
		catch (e)
		{
			ws.send("Error:" + "Error updating repeat for " + musicInfo.player());
			ws.send("ErrorD:" + e);
		}
		//UPDATE SHUFFLE
		try
		{
			if (musicInfo.shuffle !== null)
			{
				temp = musicInfo.shuffle();
				if (currShuffle !== temp && temp !== null)
				{
					ws.send("SHUFFLE:" + temp);
					currShuffle = temp;
				}
			}
		}
		catch (e)
		{
			ws.send("Error:" + "Error updating shuffle for " + musicInfo.player());
			ws.send("ErrorD:" + e);
		}


		//OPTIONAL ID UPDATERS FOR PLUGIN USE
		//UPDATE TRACKID
		try
		{
			if (musicInfo.trackID !== null)
			{
				temp = musicInfo.trackID();
				if (currShuffle !== temp && temp !== null)
				{
					ws.send("TRACKID:" + temp);
					currShuffle = temp;
				}
			}
		}
		catch (e)
		{
			ws.send("Error:" + "Error updating trackID for " + musicInfo.player());
			ws.send("ErrorD:" + e);
		}
		//UPDATE ARTISTID
		try
		{
			if (musicInfo.artistID !== null)
			{
				temp = musicInfo.artistID();
				if (currShuffle !== temp && temp !== null)
				{
					ws.send("ARTISTID:" + temp);
					currShuffle = temp;
				}
			}
		}
		catch (e)
		{
			ws.send("Error:" + "Error updating artistID for " + musicInfo.player());
			ws.send("ErrorD:" + e);
		}
		//UPDATE ALBUMID
		try
		{
			if (musicInfo.albumID !== null)
			{
				temp = musicInfo.albumID();
				if (currShuffle !== temp && temp !== null)
				{
					ws.send("ALBUMID:" + temp);
					currShuffle = temp;
				}
			}
		}
		catch (e)
		{
			ws.send("Error:" + "Error updating albumID for " + musicInfo.player());
			ws.send("ErrorD:" + e);
		}
	}
	else
	{
		//@TODO Maybe make it so it clears data/disconnects if this is true and not just sets music to stopped
		if (currState !== 0)
		{
			ws.send("STATE:" + 0);
			currState = 0;
		}
	}
}

/*
███████ ██    ██ ███████ ███    ██ ████████     ██   ██  █████  ███    ██ ██████  ██      ███████ ██████  ███████
██      ██    ██ ██      ████   ██    ██        ██   ██ ██   ██ ████   ██ ██   ██ ██      ██      ██   ██ ██
█████   ██    ██ █████   ██ ██  ██    ██        ███████ ███████ ██ ██  ██ ██   ██ ██      █████   ██████  ███████
██       ██  ██  ██      ██  ██ ██    ██        ██   ██ ██   ██ ██  ██ ██ ██   ██ ██      ██      ██   ██      ██
███████   ████   ███████ ██   ████    ██        ██   ██ ██   ██ ██   ████ ██████  ███████ ███████ ██   ██ ███████
*/


function fireEvent(event)
{
	try
	{
		if (musicEvents.readyCheck === null || musicEvents.readyCheck())
		{
			if (event.data.toLowerCase() == "playpause" && musicEvents.playpause !== null)
			{
				musicEvents.playpause();
			}
			else if (event.data.toLowerCase() == "next" && musicEvents.next !== null)
			{
				musicEvents.next();
			}
			else if (event.data.toLowerCase() == "previous" && musicEvents.previous !== null)
			{
				musicEvents.previous();
			}
			else if (event.data.toLowerCase().includes("setprogress ") || event.data.toLowerCase().includes("setposition "))
			{
				if (musicEvents.progress !== null)
				{
					var progress = event.data.toLowerCase();
					//+9 because "progress " is 9 chars
					progress = progress.substring(progress.indexOf("progress ") + 9);
					//Goto the : at the end of the command, this command is now a compound command the first half is seconds the second is percent
					progress = parseFloat(progress.substring(0, progress.indexOf(":")));

					musicEvents.progress(progress);
				}
				else if (musicEvents.progressSeconds !== null)
				{
					var position = event.data.toLowerCase();
					//+9 because "position " is 9 chars
					position = position.substring(position.indexOf("position ") + 9);
					//Goto the : at the end of the command, this command is now a compound command the first half is seconds the second is percent
					position = parseInt(position.substring(0, position.indexOf(":")));

					musicEvents.progressSeconds(position);
				}
			}
			else if (event.data.toLowerCase().includes("setvolume ") && musicEvents.volume !== null)
			{
				var volume = event.data.toLowerCase();
				//+7 because "volume " is 7 chars
				volume = parseInt(volume.substring(volume.indexOf("volume ") + 7)) / 100;
				musicEvents.volume(volume);
			}
			else if (event.data.toLowerCase() == "repeat" && musicEvents.repeat !== null)
			{
				musicEvents.repeat();
			}
			else if (event.data.toLowerCase() == "shuffle" && musicEvents.shuffle !== null)
			{
				musicEvents.shuffle();
			}
			else if (event.data.toLowerCase() == "togglethumbsup" && musicEvents.toggleThumbsUp !== null)
			{
				musicEvents.toggleThumbsUp();
			}
			else if (event.data.toLowerCase() == "togglethumbsdown" && musicEvents.toggleThumbsDown !== null)
			{
				musicEvents.toggleThumbsDown();
			}
			else if (event.data.toLowerCase() == "rating " && musicEvents.rating !== null)
			{
				musicEvents.rating();
			}
		}
	}
	catch (e)
	{
		ws.send("Error:" + "Error sending event to " + musicInfo.player);
		ws.send("ErrorD:" + e);
		throw e;
	}
}