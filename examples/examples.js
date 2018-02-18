{ /* global rilti */
  const {dom: {a, div, h1, ul, li}, render, router} = rilti

  const hello = h1('rilti-dom greets the world!')

  render(hello)

  const pageLinkList = ul()

  const pageHost = div({
    render: 'body'
  },
    h1('router example'),
    pageLinkList
  )

  const pages = ['home', 'about', 'contact']
  pages.map(page => {
    li(
      {render: pageLinkList},
      a({href: '#' + page}, 'goto: ' + page)
    )

    router({
      [page]: {
        host: pageHost,
        view: div(`I am the ${page} page.`)
      }
    })
  })
}
