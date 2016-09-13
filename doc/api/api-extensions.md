plug.dj client-side API extensions
==================================

plug.dj provides a small JavaScript API on the global `API` variable. You can
use it to do many common tasks, like listening for general events, sending
standard chat messages, retrieving data, and executing moderation commands.
ExtPlug extends it with a few more events and methods.

The plug.dj client-side API can not do nearly as much as the internal modules
that are made available by `plug-modules`, but it is much simpler, and at least
somewhat stable. Try to use the `API` variable when you can.

Official documentation for the plug.dj API is available on the [Support
website][plug.dj API]. This document contains enhancements applied by ExtPlug.

## Contents

  * ["Early" Events](#early-events)

### "Early" Events

The plug.dj `API` object adds a 250 millisecond delay before it actually
triggers events. Usually that's fine, but you may want faster responses for some
events. That's what the `BEFORE_` events are for.

With ExtPlug, every plug.dj `API.*` event has an `API.BEFORE_*` counterpart
that's fired immediately, i.e. 250 milliseconds before the `API.*` event. They
receive the same parameters as the normal events and work in pretty much the
exact same way.

```js
// make everyone say goodbye!
API.on(API.BEFORE_USER_LEAVE, user => {
  Events.trigger('chat:incoming', {
    // plug.dj uses the uid property to retrieve the user's role and badge,
    // among other things. The user is removed from plug.dj's memory when the
    // USER_LEAVE event is fired, so it wouldn't find the role nor the badge
    // anymore. It's all still there during the BEFORE_USER_LEAVE event!
    uid: user.id,
    un: user.username,
    message: 'I\'m leaving ): Bye! :wave:'
  })
})
```

You shouldn't use the `API.BEFORE_*` events if the `API.*` work for your
purposes (which is most of the time), so you don't accidentally interfere with
plugins that _do_ really need the earlier notice.

[plug.dj API]: http://support.plug.dj/hc/en-us/sections/200353347-Front-End-API
