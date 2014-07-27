(function() {
  'use strict';

  // Utils
  const aps   = Array.prototype.slice;
  const slice = aps.call.bind(aps);
  const $     = document.querySelector.bind(document);

  // Selectors
  const progSel  = '#progress';
  const bgSel    = '#bg';
  const inputSel = 'input';

  // Caches for private references w/o requerying
  // and for bound callback functions
  const shadows = new WeakMap();
  const cbs     = new WeakMap();
  const inputs  = new WeakMap();
  const progs   = new WeakMap();

  // Shadow DOM construction and caching
  let buildShadow = (function() {
    const tmpl = $('#progress-bar-innards');

    let cacheInput = function(node) {
      inputs.set(node, shadows.get(node).querySelector(inputSel));
      return inputs.get(node);
    };

    let cacheProgRect = function(node) {
      progs.set(node, shadows.get(node).querySelector(progSel));
      return progs.get(node);
    };

    return function(node) {
      let tmplClone = document.importNode(tmpl.content, true);
      let shadow = node.createShadowRoot();
      shadow.appendChild(tmplClone);
      shadows.set(node, shadow);
      cacheInput(node);
      cacheProgRect(node);
      configureChildren(node);
      return shadow;
    };
  }());

  // Applying attributes to child nodes
  let configureChildren = (function() {
    const attrs = Object.freeze({
      rx:          { name: 'rx',   sels: [progSel, bgSel] },
      ry:          { name: 'ry',   sels: [progSel, bgSel] },
      'bg-fill':   { name: 'fill', sels: [bgSel] },
      'prog-fill': { name: 'fill', sels: [progSel] }
    });

    return function(node) {
      let shadow = shadows.get(node);
      let qs = shadow.querySelector.bind(shadow);
      slice(node.attributes).forEach(function(attr) {
        let config = attrs[attr.name];
        config.sels.map(qs).forEach(function(node) {
          node.setAttribute(config.name, attr.value);
        });
      });
    };
  }());

  // Binding events to child nodes
  let bindEvents = (function() {
    let inputHandler = function(e) {
      setProgWidthOf(this);
    };

    let buildBoundInputHandler = function(node) {
      let inputCb = inputHandler.bind(node);
      cbs.set(node, inputCb);
      return inputCb;
    };

    return function(node) {
      inputs.get(node).addEventListener('input', buildBoundInputHandler(node));
    };
  }());

  // Utility function to set the width of the progress
  // based on `node`'s input
  let setProgWidthOf = function(node) {
    progs.get(node).setAttribute('width', inputs.get(node).value);
  };

  // Building the prototype of the custom element
  const proto = Object.create(HTMLElement.prototype);

  Object.defineProperties(proto, {

    createdCallback: { value: function() {
      console.log( 'created', this );
      buildShadow(this);
      setProgWidthOf(this);
      bindEvents(this);
    } },

    attachedCallback: { value: function() {
      console.log( 'attached', this );
      // setTimeout(this.remove.bind(this), 3000);
    } },

    detachedCallback: { value: function() {
      console.log( 'detached', this );
      this.removeEventListener('input', cbs.get(this));
    } },

    attributeChangedCallback: { value: function() {
      console.log( 'attributeChanged', this );
    } }

  });

  let Progress = document.registerElement('progress-bar', {

    prototype: proto

  });

}());
