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
  const notifiers = new WeakMap();
  const observers = new WeakMap();
  const shadows   = new WeakMap();
  const cbs       = new WeakMap();
  const inputs    = new WeakMap();
  const outputs   = new WeakMap();
  const progs     = new WeakMap();

  // Builds a notifier for `node` for use with
  // `Object.observe`
  let buildNotifier = function(node) {
    notifiers.set(node, Object.getNotifier(node));
    return notifiers.get(node);
  };

  let observe = (function() {
    // `this` will be bound to a node
    let observer = function(changes) {
      render(this);
    };

    // Whenever `node` `update`s, call `observer` which
    // will rerender the node.
    return function(node) {
      observers.set(node, observer.bind(node));
      Object.observe(node, observers.get(node), ['update']);
      return observers.get(node);
    };
  }());


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

  let die = function(node) {
    node.removeEventListener('input', cbs.get(node));
    Object.unobserve(node, observers.get(node));
  };

  // Rendering the width of the progress and
  // the value of the output node.
  let render = (function() {

    let pct = function(n, d) {
      return 100 * (n / d) + '%';
    };

    let extractNumAttr = function(node, attr) {
      return Math.abs(parseFloat(node.getAttribute(attr)));
    };

    let setProgWidthOf = function(node) {
      let input = inputs.get(node);
      let min   = extractNumAttr(input, 'min');
      let max   = extractNumAttr(input, 'max');
      let val   = input.valueAsNumber;
      progs.get(node).style.width = pct(val + min, min + max);
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

    value: {
      get: function() {
        return inputs.get(this).valueAsNumber;
      },
      set: function(val) {
        inputs.get(this).value = val;
        notifiers.get(this).notify({
          type: 'update',
          name: 'innerInput'
        });
        return this;
      }
    },

    createdCallback: { value: function() {
      console.log( 'created', this );
      buildNotifier(this);
      observe(this);
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
      die(this);
    } },

    attributeChangedCallback: { value: function() {
      console.log( 'attributeChanged', this );
    } }

  });

  let Progress = document.registerElement('progress-bar', {

    prototype: proto

  });

}());
