plug.dj Events
==============

Plug.dj's core JavaScript component is the Event bus (also known as the
"Context"). Everything that happens in the client side is dispatched onto this
central bus, so other components can listen in and do their work. Usually, all
user interactions and all socket events get dispatched to the Event bus.

## Contents

1. [The Event Bus](#the-event-bus)
   1. [Events.dispatch(eventInstance)](#eventsdispatcheventinstance)
   1. [Events.trigger(eventName, ...data)](#eventstriggereventname-data)
   1. [Events.on(eventName, handler, [bind])](#eventsoneventname-handler-bind)
   1. [Events.off(eventName, handler)](#eventsoffeventname-handler)
1. [Event Classes](#event-classes)
   1. [Event Listing](#event-listing)
      1. [AlertEvent](#alertevent)
      1. [ChatFacadeEvent](#chatfacadeevent)
      1. [CustomRoomEvent](#customroomevent)
      1. [DJEvent](#djevent)
      1. [FriendEvent](#friendevent)
      1. [HistorySyncEvent](#historysyncevent)
      1. [ImportSoundCloudEvent](#importsoundcloudevent)
      1. [ImportYouTubeEvent](#importyoutubeevent)
      1. [MediaActionEvent](#mediaactionevent)
      1. [MediaDeleteEvent](#mediadeleteevent)
      1. [MediaGrabEvent](#mediagrabevent)
      1. [MediaInsertEvent](#mediainsertevent)
      1. [MediaMoveEvent](#mediamoveevent)
      1. [MediaUpdateEvent](#mediaupdateevent)
      1. [ModerateEvent](#moderateevent)
      1. [PlaylistActionEvent](#playlistactionevent)
      1. [PlaylistCreateEvent](#playlistcreateevent)
      1. [PlaylistRenameEvent](#playlistrenameevent)
      1. [PreviewEvent](#previewevent)
      1. [RelatedBackEvent](#relatedbackevent)
      1. [RestrictedSearchEvent](#restrictedsearchevent)
      1. [RoomCreateEvent](#roomcreateevent)
      1. [RoomEvent](#roomevent)
      1. [ShowDialogEvent](#showdialogevent)
      1. [ShowUserRolloverEvent](#showuserrolloverevent)
      1. [StoreEvent](#storeevent)
      1. [UserEvent](#userevent)
      1. [UserListEvent](#userlistevent)
   1. [Event Names](#event-names)
      ...

## The Event Bus

The Event bus is a single object, located at `require('plug/core/Events')`. It's
a clone of [Backbone.Events](http://backbonejs.org/#Events) and supports all the
Backbone.Events methods. The most important ones are also included below.

### Events.dispatch(eventInstance)

Dispatches an Event Class instance. This style of dispatch is the most used.
You'll mostly dispatch existing Event Classes, which are described below. If you
are working on a simple plugin, it is probably easier to just use the
`trigger()` and `on()` methods instead.

```javascript
// Dispatching events
const Events = require('plug/core/Events');
const DJEvent = require('plug/events/DJEvent');

Events.dispatch(new DJEvent(
  DJEvent.JOIN // Event type
));
```

### Events.trigger(eventName, ...data)

Triggers an event. The `data` parameters will be passed on to every handler. See
[Backbone.Events.trigger](http://backbonejs.org/#Events-trigger) for more.

```javascript
Events.trigger('tooltip:show', 'Tooltip contents');
Events.trigger('notify', 'icon-class', 'Notification Text');
```

### Events.on(eventName, handler, [bind])

Adds an event listener. The `handler` will be called when `eventName` is triggered.
See [Backbone.Events.on](http://backbonejs.org/#Events-on) for more.

```javascript
Events.on('notify', (cls, text) => {
  console.log('notification', cls, text);
});
```

### Events.off(eventName, handler)

Removes an event listener. See [Backbone.Events.off](http://backbonejs.org/#Events-off)
for more.

```
function handler() { console.log('Handled!'); }

Events.on('log', handler);
Events.trigger('log'); // logs
Events.off('log', handler);
Events.trigger('log'); // does not log
```

## Event Classes

Event Classes are used internally for most events. They can contain any kind of
extra information, which is sometimes useful.

### Event

All Event Classes inherit from the base `Event` class, defined in `plug/events/Event`.
Many event classes encompass several different event types. For example, the `AlertEvent`
can be used for Alert dialogs, but also for Confirmation dialogs. Even more interesting
is the `ModerationEvent`, which contains event types for wait list management, chat
deletion, and banning and muting users. Internally, the event type is used as the event
name in the `Backbone.Events` instance.

Event types are defined as static constants on the event class. Examples include
`DJEvent.JOIN`, `PlaylistActionEvent.SHUFFLE`, and `FriendEvent.UNFRIEND`.
Event Classes are instantiated by passing an event type and sometimes extra information.

```javascript
// an event without extra data.
const DJEvent = require('plug/events/DJEvent');
let joinBoothEvent = new DJEvent(DJEvent.JOIN);
// Events.dispatch(joinBoothEvent) will make the current user join the wait list.

// an event with a data parameter
const PlaylistActionEvent = require('plug/events/PlaylistActionEvent');
let shufflePlaylistEvent = new PlaylistActionEvent(PlaylistActionEvent.SHUFFLE, playlistId);
// Events.dispatch(shufflePlaylistEvent) will shuffle the playlist with id `playlistId`.
```

### Event Listing

#### AlertEvent

`AlertEvent`s are used to display plug.dj-styled alert and confirmation boxes.
AlertEvents take at least three parameters: `title`, `message` and `action`.

 * `title` - displayed in the title bar of the dialog. If the alert type is
   `CONFIRM`, it's also used as the text for the Confirm button.
 * `message` - displayed in the body of the dialog. HTML will *not* be escaped.
 * `action` - action to execute when an `ALERT` dialog is OK'd, or when a
   `CONFIRM` dialog is confirmed. This will usually be a callback function, but
   it can also be another `Event` class instance, which will be dispatched into
   the Event bus.

##### AlertEvent.ALERT

The `ALERT` type shows an alert box with a single confirmation button.

`AlertEvent.ALERT` events also have an additional optional parameter:

 * `forceAction` - Execute the action even if the user closed the dialog without
   pressing OK. `ALERT` dialogs only.

```javascript
let event = new AlertEvent(
  AlertEvent.ALERT,
  'Something happened!',
  'Wow! Something actually happened!',
  () => { /* action when OK'd */ },
  true // true to execute the action even if the OK button was not pressed
);
```

##### AlertEvent.CONFIRM

The `CONFIRM` type shows an alert box with a confirmation button and an abort
button. The given action is only executed when the confirmation button is
pressed, and not when the abort button or the close button are pressed.

```javascript
let event = new AlertEvent(
  AlertEvent.CONFIRM,
  'Confirm title (also used as the OK Button text, keep it short)',
  'Some more information about the decision you\'re about to make.',
  // Confirm button was pressed!
  // this event will be dispatched to the Event bus
  new ExplodeEvent(ExplodeEvent.SELF_DESTRUCT, { severity: 10 })
);
```

#### ChatFacadeEvent

`ChatFacadeEvent`s are used by the buttons above the chat, such as the toggle buttons for
emoji and mention sounds. The chat view and the popped-out chat view both listen for
these events.

##### ChatFacadeEvent.CLEAR

Clears the chat display. This only affects your view of the chat: the messages will not
actually be deleted.

```javascript
let event = new ChatFacadeEvent(ChatFacadeEvent.CLEAR);
```

##### ChatFacadeEvent.EMOJI

Enables or disables emoji display. Pass `true` to enable emoji, or `false` to disable emoji.

```javascript
// do not display emoji as images, but just as :text:
let disable = new ChatFacadeEvent(ChatFacadeEvent.EMOJI, false);
// haha, just kidding, why would anyone want to disable emoji?
// emoji should be enabled and you know it. :hankey:
let enable = new ChatFacadeEvent(ChatFacadeEvent.EMOJI, true);
```

##### ChatFacadeEvent.MENTIONS

Enables or disables mentions-only mode. In mentions-only mode, only messages that contain
your `@username` will be displayed. Pass `true` to enable mentions-only mode (and hide all
other messages), or `false` to disable mentions-only mode (and show all messages).

```javascript
// I do not want to be distracted.
let event = new ChatFacadeEvent(ChatFacadeEvent.MENTIONS, true);
```

##### ChatFacadeEvent.SOUND

Enables or disables the mention sound. Pass `true` to enable the sound and get a Ding! when
someone @-mentions you, or `false` to disable the sound.

```javascript
// I do not want to be distracted.
let event = new ChatFacadeEvent(ChatFacadeEvent.SOUND, false);
```

##### ChatFacadeEvent.TIMESTAMP

Sets the chat messages timestamp display style. Pass `false` to disable timestamps on messages,
`12` to use 12-hour, AM/PM style timestamps (1:37PM), or `24` to use 24-hour notation (13:37).

```javascript
// set to 24-hour time display
let event = new ChatFacadeEvent(ChatFacadeEvent.TIMESTAMP, 24);
```

#### CustomRoomEvent

The `CustomRoomEvent` is used to load additional JavaScript for specific rooms.
Partnered rooms like Tastycat and Mineplex get their own bit of JavaScript that
sets their custom backgrounds, for example.

##### CustomRoomEvent.CUSTOM

Loads and executes a JavaScript file. This event takes a single parameter:

 * `path` - URL to the JS file to load.

**Note that you should never have to do this in your own plugins.** If you do
need to load additional JavaScript yourself, there's a global `requirejs`
function at your disposal which loads files perfectly, and also gives you error
handling and stuff.

#### DJEvent

The `DJEvent` relates to the DJ booth or wait list. It's used to let the current
user join or leave the wait list, and to make the current user skip their own
plays.

##### DJEvent.JOIN

Joins the wait list. No parameters.

```javascript
let event = new DJEvent(DJEvent.JOIN);
```

##### DJEvent.LEAVE

Leaves the wait list. No parameters. Note that this does *not* ask the user for
confirmation, even though clicking the "Leave wait list" button does.

```javascript
let event = new DJEvent(DJEvent.LEAVE);
```

##### DJEvent.SKIP

Skips the current song, **if** the current user is DJing. No parameters.

```javascript
let event = new DJEvent(DJEvent.SKIP);
```

#### FriendEvent

`FriendEvent`s relate to friendship requests. They are used to accept or ignore
requests, and to remove friends. All FriendEvents take a single parameter:

 * `userId` - The user ID of the user who you are friends with, or who sent you
   a friend request.

##### FriendEvent.UNFRIEND

Removes a user from your friends. Note that it does *not* ask the user for
confirmation.

```javascript
let stupidFriend = 1234567; // random user id
let event = new FriendEvent(FriendEvent.UNFRIEND, stupidFriend);
```

##### FriendEvent.ACCEPT

Accepts a friend request from the given user ID. Note that internally, plug.dj
accepts a friend request by *sending* a friend request to the given user. If a
friend request *from* that user already exists, your friendship will be
confirmed; otherwise, you will send a *new* request to the user. Thus, if you
"accept" a friend request from a user who has not sent you a request, you will
*send* a request instead.

```javascript
let niceUser = 1234567;
let event = new FriendEvent(FriendEvent.ACCEPT, niceUser);
```

##### FriendEvent.IGNORE

Ignores a friend request from the given user ID.

```javascript
let stupidUser = 1234567;
let event = new FriendEvent(FriendEvent.IGNORE, stupidUser);
```

#### HistorySyncEvent

A `HistorySyncEvent` fetches the play history of the current room or the current
user, loads it into the appropriate collections, and updates the UI. These
events always use the current room or the current user, so they do not take any
parameters.

##### HistorySyncEvent.ROOM

Reloads the room history.

```javascript
let event = new HistorySyncEvent(HistorySyncEvent.ROOM);
```

##### HistorySyncEvent.USER

Reloads the current user's play history.

```javascript
let event = new HistorySyncEvent(HistorySyncEvent.USER);
```

#### ImportSoundCloudEvent

TODO

#### ImportYouTubeEvent

TODO

#### MediaActionEvent

All user interaction with media in playlists is handled by `MediaActionEvent`s.
Basically, everything that might get a button in a media row in the playlists
panel, gets its own `MediaActionEvent`. These events generally just do user
interface stuff, and do *not* actually manipulate playlists or media directly.
They depend heavily on the plug.dj DOM structure. As such, they aren't
particularly useful for programmatic use. Instead, use the other `Media*Event`s,
or use the appropriate View classes directly.

#### MediaDeleteEvent

##### MediaDeleteEvent.DELETE

Deletes media from a playlist. Takes two parameters:

 * `playlistId` - The ID of the playlist to affect.
 * `ids` - An Array of media IDs to remove from the playlist. Note that you can
   *not* pass a single media ID.

```javascript
let playlist = 1234567;
let ids = [ 12345678, 12345679, 12345680 ];

let event = new MediaDeleteEvent(MediaDeleteEvent.DELETE, playlist, ids);
```

#### MediaGrabEvent

##### MediaGrabEvent.GRAB

Grabs a song from the history. (The history includes media that's currently
playing.) Takes two parameters:

 * `playlistId` - The ID of the playlist to "grab" to.
 * `historyId` - **History** ID of the media to grab. This is *not* the media
   ID. A history ID can be obtained from the `roomHistory` and `userHistory`
   collections, as well as the `currentMedia` model. If you just want to add
   media to a playlist, use `MediaInsertEvent` instead.

```javascript
let playlistId = 1234567;
let historyId = currentMedia.get('historyID');

let event = new MediaGrabEvent(MediaGrabEvent.GRAB, playlistId, historyId);
```

#### MediaInsertEvent

##### MediaInsertEvent.INSERT

Inserts media into a playlist. Takes four parameters:

 * `playlist` - Playlist **model** (not ID!) to add to.
 * `items` - Array of `Media` instances to add to the playlist.
 * `append` - Not sure, plug.dj always uses `false`.
 * `confirmCount` - Amount of items, used for display in the "Media added"
   notification.

```javascript
let playlist = playlists.findWhere({ name: 'My Playlist' });
let items = [ new Media(...), new Media(...) ];

let event = new MediaInsertEvent(
  MediaInsertEvent.INSERT,
  playlist,
  items,
  false,
  items.length
);
```

#### MediaMoveEvent

Handles moving media around within the *currently visible* playlist. That's
the playlist that is currently opened in the playlists panel. Note that the
*visible* playlist and the *active* playlist are different: the active playlist
is what you're currently DJing from, and the visible playlist is the playlist
that's currently loaded in the playlists panel.

##### MediaMoveEvent.MOVE

Moves media to a location within the *currently visible* playlist. It only takes
two parameters:

 * `items` - Array of `Media` instances to move.
 * `beforeId` - Media ID to move the items to, or `0` to move the items to the
   very end of the playlist.

```javascript
let items = currentPlaylist.slice(10, 20);
let beforeId = currentPlaylist.get(50).get('id');

let event = new MediaMoveEvent(MediaMoveEvent.MOVE, items, beforeId);

// move to end
let items = currentPlaylist.slice(0, 10);
let event = new MediaMoveEvent(MediaMoveEvent.MOVE, items, 0);
```

##### MediaMoveEvent.SHUFFLE

Shuffles the *currently visible* playlist. Does not take any parameters.

```javascript
let event = new MediaMoveEvent(MediaMoveEvent.SHUFFLE);
```

#### MediaUpdateEvent

##### MediaUpdateEvent.UPDATE

Updates media metadata (author and title). Takes three parameters:

 * `media` - The `Media` instance to update.
 * `author` - The new media author string.
 * `title` - The new media title string.

```javascript
let media = getMediaInstanceSomehow();
let event = new MediaUpdateEvent(
  MediaUpdateEvent.UPDATE,
  media,
  'My Band',
  'Our Song'
);
```

#### ModerateEvent

TODO

#### PlaylistActionEvent

TODO

#### PlaylistCreateEvent

TODO

#### PlaylistRenameEvent

TODO

#### PreviewEvent

TODO

#### RelatedBackEvent

TODO

#### RestrictedSearchEvent

TODO

#### RoomCreateEvent

TODO

#### RoomEvent

TODO

#### ShowDialogEvent

TODO

#### ShowUserRolloverEvent

TODO

#### StoreEvent

TODO

#### UserEvent

TODO

#### UserListEvent

TODO

## Event Names

Some events don't have separate event classes, but are plainly `.trigger`-ed on
the `Events` object. To trigger these events, use
`Events.trigger(eventName, ...data)`. To listen for these events, use
`Events.on(eventName, cb)`.

### Event Listing

TODO
