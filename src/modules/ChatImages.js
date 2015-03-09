(extp = window.extp || []).push(function (ext) {

  ext.define('ChatImages', function (require, exports, module) {

    var $ = require('jquery'),
      ChatView = require('plug/views/rooms/chat/ChatView'),
      Events = require('plug/core/Events'),
      Module = require('extplug/Module'),
      fnUtils = require('extplug/util/function');

    function embeddedImg(html) {
      return '<div class="extplug-cembed">' +
               html +
               '<div class="extplug-cemclose">close ×</div>' +
             '</div>'
    }

    return Module({
      name: 'Chat Images',
      description: 'Embeds image links in chat as actual images.',

      init: function () {
        fnUtils.bound(this, 'onChat');
        fnUtils.bound(this, 'onCloseClick');
      },

      enable: function () {
        Events.on('chat:beforereceive', this.onChat);
        this.Style({
          '.extplug-cembed': {
            'position': 'relative'
          },
          '.extplug-cemclose': {
            'position': 'absolute',
            'background': '#700',
            'cursor': 'pointer',
            'top': '2px',
            'right': '2px',
            'color': '#fff',
            'padding': '3px 7px',
            'text-align': 'right',
            'display': 'none'
          },
          '.extplug-cembed:hover .extplug-cemclose': {
            'display': 'block'
          },
          '.extplug-cembed > img, .extplug-cembed > video': {
            'max-width': '100%'
          }
        });

        this.ext.document.on('click.chatimages', '.extplug-cemclose', this.onCloseClick);
      },

      disable: function () {
        Events.off('chat:beforereceive', this.onChat);
        this.ext.document.off('click.chatimages');
      },

      onCloseClick: function (e) {
        e.preventDefault();

        var embed = $(e.target).closest('.extplug-cembed'),
          link = embed.closest('a');
        embed.remove();
        link.text(link.attr('href'));
      },

      onChat: function (message) {
        var $el = $('<div />').html(message.message);
        var embedders = this.embedders;
        $el.find('a').map(function () {
          var a = $(this),
            href = a.attr('href'),
            match, html;
          for (var i = 0, l = embedders.length; i < l; i++) {
            if (match = embedders[i].regex.exec(href)) {
              html = embedders[i].replace.apply(null, [ href ].concat(match));
              html && a.html(embeddedImg(html));
              return;
            }
          }
        });
        message.message = $el.html();
      },

      embedders: [
        { // generic
          regex: /\.(?:gif|png|jpe?g)(?:\?.*|#.*)?$/gi,
          replace: function (href) {
            return '<img alt="" src="' + href + '">';
          }
        },
        { // imgur gifv
          regex: /https?:\/\/(?:www\.)?(?:i\.)?imgur\.com\/([a-z0-9]+?)\.([a-z0-9]+)\b/gi,
          replace: function (href, $0, img, ext) {
            if (ext === 'gifv' || ext === 'webm' || ext === 'mp4') {
              return '<video autoplay loop poster="https://i.imgur.com/' + img + '.jpg">' +
                       '<source src="https://i.imgur.com/' + img + '.webm" type="video/webm">' +
                       '<source src="https://i.imgur.com/' + img + '.mp4" type="video/mp4">' +
                     '</video>';
            }
          }
        }
      ]
    });

  });

});