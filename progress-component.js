(function() {
  'use strict';

  // Utils
  const aps   = Array.prototype.slice;
  const slice = aps.call.bind(aps);
  const $     = document.querySelector.bind(document);

  // Selectors
  const progSel   = '#progress';
  const bgSel     = '#bg';
  const inputSel  = 'input';
  const outputSel = 'output';

  // Caches for private references w/o requerying
  // and for bound callback functions
  const shadows = new WeakMap();
  const cbs     = new WeakMap();
  const inputs  = new WeakMap();
  const outputs = new WeakMap();
  const progs   = new WeakMap();

  // Shadow DOM construction and caching
  let buildShadow = (function() {
    const tmpl = $('#progress-bar-innards');

    let cacheNode = function(node, map, selector) {
      map.set(node, shadows.get(node).querySelector(selector));
      return map.get(node);
    };

    return function(node) {
      let tmplClone = document.importNode(tmpl.content, true);
      let shadow = node.createShadowRoot();
      shadow.appendChild(tmplClone);
      shadows.set(node, shadow);
      cacheNode(node, inputs, inputSel);
      cacheNode(node, outputs, outputSel);
      cacheNode(node, progs, progSel);
      configureChildren(node);
      return shadow;
    };
  }());

  // Applying attributes to child nodes
  let configureChildren = (function() {
    const attrs = Object.freeze({
      min:  { name: 'min',  sels: [inputSel] },
      max:  { name: 'max',  sels: [inputSel] },
      step: { name: 'step', sels: [inputSel] }
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
      render(this);
      render(this);
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

  // Rendering the width of the progress and
  // the value of the output node.
  let render = (function() {

    let pct = function(n, d) {
      return 100 * (n / d) + '%';
    };

    let setProgWidthOf = function(node) {
      let input = inputs.get(node);
      let max   = parseFloat(input.getAttribute('max'));
      let val   = input.valueAsNumber;
      progs.get(node).style.width = pct(val, max);
    };

    let setOutputOf = function(node) {
      outputs.get(node).value = inputs.get(node).valueAsNumber;
    };

    return function(node) {
      setProgWidthOf(node);
      setOutputOf(node);
    };

  }());


  // Building the prototype of the custom element
  const proto = Object.create(HTMLElement.prototype);

  Object.defineProperties(proto, {

    createdCallback: { value: function() {
      console.log( 'created', this );
      buildShadow(this);
      render(this);
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
