# 💫 rilti-dom 💫
## write your dom with functions  

**it's [rilti.js](https://github.com/SaulDoesCode/rilti.js) but only the dom parts**

rilti-dom weighs in at only ~2.5KB gzipped and ~5.1KB just minified.

Basically rilti-dom is html tags as functions but with superpowers.     

But Wait that's not all folks, there's more!     
We also have a routing system similar to ``RE:DOM's``,
not to mention that the ``rilti`` object includes
nifty functions like ``.curry, .extend, .each, .flatten, .runAsync`` as well as features
like ``.on/once(target, event_type, e => {}, =options_from_addEventListener)``      
or
```js
rilti.on/once.anyEventImaginable(target, (event, target) => {}, =options)
```

And don't get me started on ``.isX(x) -> bool`` type functions which include
``.isDef, isArr, isArrlike, isStr, isBool, isObj, isNum, isNil, isNode, isInput, isPrimitive, isRenderable``

Ooh and one last thing... `rilti.domfn.mutate`
But can your framework do this?
```js
const {dom, domfn: {mutate}} = rilti

// async/await because .onload or 'DOMContentLoaded' is old school
(async () => {
  const cardElement = await dom('div.card')

  mutate(cardElement, {
    class: {
      disabled: false,
      'material-shadow': true
    },
    attr: {
      'data-card-type': 'modal'
    },
    css: {
      '--highlight-color': 'crimson',
      // ^_ css variables? uh-huh totally.
      cursor: 'not-allowed' // can't touch this! da na-na-na
    }
    once: {
      destroy (e) {
        console.log('card is no more :(')
      }
    },
    ondblclick: e => console.log('Why you touch me like this?')
  })
})()
```

## example

```js
const {dom: {h1}, render} = rilti

const hello = h1('rilti-dom greets the world!')

render(hello) // -> to <body>
```

OR

```js
rilti.dom.h1(
  {render: 'body'},
  'rilti-dom greets the world!'
)
```

#### Site Navigation

```js
const {
  dom: {a, p, nav, header, h1, main, div, html},
  router
} = rilti

const navbar = header({
  render: 'body',
  class: 'navbar'
},
  h1('My Awesome Site!'),
  nav(
    a({href: '#home'}, 'home'),
    a({href: '#about'}, 'about'),
    a({href: '#contact'}, 'contact'),
    a({
      href: 'https://github.com/SaulDoesCode',
      attr: {target: '_blank'}
    },
      'my github'
    )
  )
)

const pageView = main({
  class: 'page-view'
})

router({
  home: {
    host: pageView,
    view: div(
      h1('Welcome to my Awsome site!'),
      p(`You're reading the "home page" of sorts.`)
    )
  },
// "#" is optional
  '#about': {
    host: pageView,
//  ^- add the view to <main class="page-view"> when the route matches
    view: [
      () => 'arrays, primitives render nodes, elements, functions...',
      p('All of ^- these rilti-dom will render with ease'),
      html(`
        No really,
        <b>Anything goes!</b>
      `)
    ]
  },
  contact: {
    host: pageView,
    view: `
      you can talk to me at saul@grimstack.io
      or if you have any issues or concerns
      put them up on github.com/SaulDoesCode.
    `
  }
})

if (!location.hash) location.hash = '#home'
```

LICENSE = MIT
