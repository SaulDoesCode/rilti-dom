/**
* rilti.js
* @repo github.com/SaulDoesCode/rilti.js
* @author Saul van der Walt
* @licence MIT
**/
{ /* global location Element CustomEvent MutationObserver Text HTMLInputElement HTMLTextAreaElement */
  const $define = Object.defineProperty
  const $getDescriptor = Object.getOwnPropertyDescriptor
  const root = window
  const doc = document
  const UNDEF = undefined
  const NULL = null

  const curry = (fn, arity = fn.length, ...args) => (
    arity <= args.length ? fn(...args) : curry.bind(UNDEF, fn, arity, ...args)
  )

  // all the is this that related stuff
  const isArr = Array.isArray
  const some = (...fns) => (...args) => fns.some(fn => fn(...args))
  const isObj = o => o && o.constructor === Object
  const isFunc = o => o instanceof Function
  const isBool = o => o instanceof Boolean
  const isStr = o => typeof o === 'string'
  const isNum = o => typeof o === 'number'
  const isNil = o => o === UNDEF || o === NULL
  const isDef = o => !isNil(o)
  const isPrimitive = some(isStr, isBool, isNum)
  const isArrlike = o => o && (isArr(o) || (!isFunc(o) && o.length % 1 === 0))
  const isEl = o => o && o instanceof Element
  const isNode = o => o && o.nodeType
  const isInput = o => o && (o instanceof HTMLInputElement || o instanceof HTMLTextAreaElement)
  const isRenderable = some(isNode, isArrlike, isPrimitive)

  const err = console.error.bind(console)

  const extend = (host = {}, obj, safe = false, keys = Object.keys(obj)) => {
    keys.forEach(key => {
      if (!safe || (safe && !(key in host))) $define(host, key, $getDescriptor(obj, key))
    })
    return host
  }

  const runAsync = (fn, ...args) => setTimeout(fn, 0, ...args)

  const each = (iterable, fn) => {
    if (!isNil(iterable)) {
      if (isObj(iterable)) for (const key in iterable) fn(iterable[key], key, iterable)
      else if (iterable.forEach) iterable.forEach(fn)
      else {
        let i = 0
        if (iterable.length) while (i !== iterable.length) fn(iterable[i], i++, iterable)
        else if (iterable % 1 === 0) while (i !== iterable) fn(i++, iterable)
      }
    }
    return iterable
  }

  const flatten = (arr, result = []) => {
    if (!isArr(arr)) return [arr]
    each(arr, val => {
      isArr(val) ? flatten(val, result) : result.push(val)
    })
    return result
  }

  const query = (selector, host = doc) => ( // return if node else query dom
    isNode(selector) ? selector : query(host).querySelector(selector)
  )

  const isMounted = (descendant, parent = doc) => (
    parent === descendant || !!(parent.compareDocumentPosition(descendant) & 16)
  )

  const EventManager = curry((once, target, type, handle, options = false) => {
    if (isStr(target)) target = query(target)
    if (isObj(type)) {
      return each(type, (fn, name) => {
        type[name] = EventManager(once, target, name, fn, options)
      })
    }
    if (!isFunc(handle)) return EventManager.bind(UNDEF, once, target, type)

    handle = handle.bind(target)

    const handler = evt => {
      handle(evt, target)
      once && remove()
    }

    const remove = () => {
      target.removeEventListener(type, handler)
      return manager
    }

    const add = mode => {
      once = !!mode
      target.addEventListener(type, handler, options)
      return manager
    }

    const manager = {
      handler,
      type,
      on: add,
      off: remove,
      once: add.bind(UNDEF, true)
    }

    return add(once)
  }, 3)

  // Event Manager Proxy Configuration
  const EMPC = {
    get: (fn, type) => (tgt, hndl, opts) => fn(tgt, type, hndl, opts)
  }
  const once = new Proxy(EventManager(true), EMPC)
  const on = new Proxy(EventManager(false), EMPC)

  const run = fn => {
    if (doc.readyState === 'complete' || doc.body) {
      runAsync(fn)
    } else {
      root.addEventListener('DOMContentLoaded', fn)
    }
  }

  const html = input => (
    isFunc(input) ? html(input()) : isNode(input) ? input : doc.createRange().createContextualFragment(input)
  )

  const frag = input => (
    isNil(input) ? doc.createDocumentFragment() : html(input)
  )

  const emit = (node, type, detail) => {
    node.dispatchEvent(new CustomEvent(type, {detail}))
  }

  // vpend - virtual append, add nodes and get them as a document fragment
  const vpend = (children, dfrag = frag()) => {
    flatten(children).forEach(child => {
      dfrag.appendChild(child = html(child))
      MNT(child)
    })
    return dfrag
  }

  const domfn = {
    css: curry((node, styles, prop) => {
      if (isObj(styles)) each(styles, (p, key) => domfn.css(node, key, p))
      else if (isStr(styles)) {
        if (styles.slice(0, 2) === '--') {
          node.style.setProperty(styles, prop)
        } else {
          node.style[styles] = prop
        }
      }
      return node
    }, 2),
    Class: curry((node, c, state = !node.classList.contains(c)) => {
      const checkState = name => isBool(state) ? state : !node.classList.contains(name)
      if (isObj(c)) {
        each(c, (state, className) => {
          domfn.Class(
            node,
            className,
            checkState(state)
          )
        })
      } else {
        if (isStr(c)) c = c.split(' ')
        isArr(c) && each(c, cl => {
          node.classList[checkState(state) ? 'add' : 'remove'](cl)
        })
      }
      return node
    }, 2),
    hasClass: curry((node, name) => node.classList.contains(name)),
    attr: curry((node, attr, val) => {
      if (isObj(attr)) {
        each(attr, (v, a) => {
          node[isNil(v) ? 'removeAttribute' : 'setAttribute'](a, v)
        })
      } else if (isStr(attr)) {
        if (!isPrimitive(val)) return node.getAttribute(attr)
        node.setAttribute(attr, val)
      }
      return node
    }, 2),
    rmAttr (node, ...attrs) {
      attrs.forEach(attr => node.removeAttribute(attr))
      return node
    },
    emit,
    append: curry((node, ...children) => {
      children = vpend(children)
      dom(node).then(n => n.appendChild(children))
      return node
    }, 2),
    prepend: curry((node, ...children) => {
      children = vpend(children)
      dom(node).then(n => n.prepend(children))
      return node
    }, 2),
    remove (node, after) {
      if (isNum(after)) {
        setTimeout(() => domfn.remove(node), after)
      } else if (isMounted(node)) {
        node.remove()
      }
      return node
    },
    mutate: (node, options, assignArbitrary = true) => each(
      options,
      (args, name) => {
        if (!isArr(args)) args = [args]
        if (name in domfn) {
          const result = domfn[name](node, ...args)
          if (result !== node) options[name] = result
        } else if (name === 'class' || name === 'className') {
          domfn.Class(node, ...args)
        } else if (name === 'children' || name === 'inner') {
          node.innerHTML = ''
          if (isRenderable(args)) domfn.append(node, args)
        } else if (name === 'text') {
          node.textContent = args
        } else if (name === 'html') {
          node.innerHTML = args
        } else {
          let mode = name.substr(0, 4)
          const isOnce = mode === 'once'
          if (!isOnce) mode = name.substr(0, 2)
          const isOn = mode === 'on'
          if (isOnce || isOn) {
            let type = name.substr(isOnce ? 4 : 2)
            const evtfn = EventManager(isOnce)
            if (!options[mode]) options[mode] = {}
            options[mode][type] = type.length ? evtfn(node, type, ...args) : evtfn(node, ...args)
          } else if (assignArbitrary || name in node) {
            isFunc(node[name]) ? node[name](...args) : node[name] = args
          }
        }
      }
    )
  }

  const mutateSet = set => (n, state) => (
    set[isBool(state) ? state ? 'add' : 'delete' : 'has'](n)
  )

  const Created = mutateSet(new WeakSet())
  const Mounted = mutateSet(new WeakSet())
  /*
    // Thanks A. Sharif, for medium.com/javascript-inside/safely-accessing-deeply-nested-values-in-javascript-99bf72a0855a
    const extract = (o, path) => isDef(o) && path
    .replace(/\[(\w+)\]/g, '.$1')
    .replace(/^\./, '')
    .split('.')
    .reduce((xs, x) => xs && xs[x] ? xs[x] : UNDEF, o)
  */

  // node lifecycle event dispatchers
  const CR = n => {
    if (!Created(n)) emit(n, 'create')
  }

  const MNT = n => {
    if (!Mounted(n)) {
      Mounted(n, true)
      emit(n, 'mount')
    }
  }

  const DST = n => {
    Mounted(n, false)
    emit(n, 'destroy')
  }

  const defaultConnector = 'appendChild'

  const render = (node, host = 'body', connector = defaultConnector) => {
    dom(host)
    .then(
      h => {
        if (!isMounted(h) && connector !== defaultConnector) {
          once.mount(h, () => {
            if (!isNode(node)) node = vpend(node)
            h[connector](node)
            MNT(node)
          })
        } else {
          if (!isNode(node)) node = vpend(node)
          h[connector](node)
          MNT(node)
        }
      },
      errs => err('render fault: ', errs)
    )
    return node
  }

  const create = (tag, options, ...children) => {
    const el = isNode(tag) ? tag : doc.createElement(tag)

    if (isRenderable(options)) children.unshift(options)
    if (children.length && el.nodeName !== '#text') {
      domfn.append(el, children)
    }

    if (isObj(options)) {
      domfn.mutate(el, options, false)
      const {props, methods, cycle} = options
      each(props, (val, prop) => {
        if (prop in el) {
          el[prop] = val
        } else if (prop === 'accessors') {
          each(val, (etters, key) => {
            const {set = etters, get = etters} = etters
            $define(el, key, {
              set: set.bind(el, el),
              get: get.bind(el, el)
            })
          })
        } else {
          $define(el, prop, $getDescriptor(props, prop))
        }
      })
      each(methods, (method, name) => {
        $define(el, name, {value: method.bind(el, el)})
      })

      if (cycle) {
        const {mount, destroy, create} = cycle
        once.create(el, e => {
          Created(el, true)
          create && create.call(el, el)
        })

        if (mount) {
          var mountListener = once.mount(el, mount.bind(el, el))
        }

        (mount || destroy) && on.destroy(el, e => {
          destroy && destroy.call(el, el)
          mountListener && mountListener.on()
        })
      }
      if (options.render) render(el, options.render)
    }

    CR(el)
    return el
  }

  const text = (options, txt) => {
    if (isStr(options)) [txt, options] = [options, {}]
    return create(new Text(txt), options)
  }

  // find a node independent of DOMContentLoaded state using a promise
  const dom = new Proxy( // ah Proxy, the audacious old browser breaker :P
  extend(
    (selector, host = doc) => new Promise((resolve, reject) => {
      if (isNode(selector)) resolve(selector)
      else if (selector === 'head') resolve(doc.head)
      else if (isStr(selector)) {
        run(() => {
          const temp = selector === 'body' ? doc.body : query(selector, host)
          isNode(temp) ? resolve(temp) : reject(new Error([400, selector]))
        })
      } else {
        reject(new Error([400, selector]))
      }
    }),
    {query, html, text, frag}
  ), {
    // gotta get the d
    get: (d, key) => Reflect.get(d, key) || create.bind(UNDEF, key),
    set (d, key, val) { d[key] = val }
  })

  const router = routes => each(routes, (view, route) => {
    if (route[0] !== '#') route = '#' + route
    router.routes[route] = view
    router.activate(route)
  })
  router.routes = {}
  router.activate = hash => {
    if (hash === location.hash && hash in router.routes) {
      const route = router.routes[hash]
      domfn.mutate(route.host, {inner: route.view})
    }
  }
  router.del = hash => delete router.routes[hash]

  on.hashchange(root, e => router.activate(location.hash))

  new MutationObserver(muts => muts.forEach(({addedNodes, removedNodes}) => {
    addedNodes.length && addedNodes.forEach(n => MNT(n))
    removedNodes.length && removedNodes.forEach(n => DST(n))
  })).observe(
    doc,
    {attributes: true, attributeOldValue: true, childList: true, subtree: true}
  )

  // I'm really sorry but I don't believe in module loaders, besides who calls their library rilti?
  root.rilti = {
    curry,
    dom,
    domfn,
    each,
    extend,
    flatten,
    on,
    once,
    render,
    router,
    run,
    runAsync,
    isMounted,
    isDef,
    isNil,
    isPrimitive,
    isFunc,
    isStr,
    isBool,
    isNum,
    isRenderable,
    isObj,
    isArr,
    isArrlike,
    isEl,
    isNode,
    isInput
  }
}
