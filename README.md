# async-redux-selector &bull; [![npm version](https://img.shields.io/npm/v/async-redux-selector.svg?style=flat-square)](https://www.npmjs.com/package/async-redux-selector)

Asynchronous Redux selectors with "just in time" data fetching.

## Table of contents

* [Introduction](#introduction)
  * [The problem](#the-problem)
  * [The solution](#the-solution)
* [Benefits](#benefits)
* [Setup](#setup)
  * [Store cache definitions](#store-cache-definitions)
  * [Store](#store)
  * [Connecting components](#connecting-components)

## Introduction

### The problem

Suppose we have a web application in which the user can search and filter a list of books. We want to:

* Fetch the books that match this filter from the server whenever the filter changes,
* display a loader while fetching.

In applications we were used to building this looks like this:

1. Dispatch an action to persist the new filter to the store;
2. Dispatch an action to show a loader; 
3. Fetch books from the server;
4. Dispatch an action to persist the received books to the store;
5. Dispatch an action to hide the loader.

This is okay to begin with, but as soon as your store and component's data requirements start to scale, this gets less than ideal quickly.

There are a [couple of approaches](#1) for the above process, but they tend to have some downsides: It's hard to figure out where to fetch the data.

We might initiate the request from the filter component, but the filter component doesn't know upfront what components are visible and what their data requirements are. This isn't such a big issue in the book store, but might get pretty complicated for larger applications.

We might also choose to fetch the data from the components where that data is actually used. This would require those components to "watch" the filter for changes. The issue then could be that two or more components require data from the same data source and dispatch duplicate requests for each separate component.

Both of these solutions tighly couple the components that render the data and the filter component together.

The request is initiated from the filter component. This component has to know what data needs to be fetched. For a simple book store, this might not be problematic, but for complex UI's where different components might be requiring the same data it could end up pretty messy quite fast. 

Another possible issue with these solutions are the possibility of race conditions that might occur. For example when the first search filter request takes a very long time to resolve, while the user might have changed the filter again which dispatches another request which is returned earlier than the response for the first request.

### The solution

This libary tries to answer the challenge of fetching data with React and Redux by asking: "How would we solve this if we had _all_ books already available in the Redux store?" There is already a solution for that part: we would use [selectors](https://redux.js.org/recipes/computing-derived-data):

This is a synchronous selector:

```javascript
const booksThatMatchFilterSelector = createSelector(
  filterSelector,
  booksSelector,
  (filter, books) => {
    return books.filter(book => book.name.includes(filter))
  }
)
```

But when we don't have the books available in the store yet, we might need to dispatch a request for the books which are needed. The solution to this problem looks fairly similar to the above selector.

Introducing the **Asynchronous Selector**:

```javascript
const asyncBooksThatMatchFilterSelector = createSelector(
  filterSelector,
  booksCacheSelector,
  (filter, booksCache) => {
    return booksCache
      .getFor(filter)
      .orFetch(() => fetch(`http://example.com/books/${filter}`))
  }
)
```

This selector will return book items in the store that match the filter defined in the filter selector, as shown above in the `.getFor(filter)` call. If there is no match in the store cache, then the next step will be to fire a request to fetch resources matching that filter.

As this example introduces a couple of new concepts, maybe now is the time to dive into [setting up this library](#setup) in your project.

## Benefits

`async-redux-selector` offers a substantial set of benefits compared to other ways of fetching data from the store or an external resource.

### Program without worrying where data comes from

You can program without having to worry about where your data comes from. For example, we can define a selector that returns only the books published before the year 2000:

```javascript
const asyncBooksBeforeYearSelector = createAsyncSelector(
  asyncBooksSelector,
  books => {
    return books.filter(book => book.year < 2000)
  }
)
```

This way you can keep writing selectors like you did before, with the added benefit that it looks like the data is in the store all along! All the asynchronous data fetching happens behind the scenes.

### Composing selectors

Dependent asynchronous selectors can be composed together, so they will kick off multiple requests in sequence. The component will receive the data when the final piece of data arrives.

Let's suppose that you would also like to retrieve comments on a certain book. We could do something like this:

```javascript
// Create a book comment IDs selector
const asyncBookCommentIdsSelector = createAsyncSelector(
  asyncBooksSelector,
  books => {
    return books.map(book => book.commentIds)
  }
)

// Create a book comments selector that fetches the actual content of the comments from the cache, or dispatch a network request to retrieve them
const asyncBookCommentsSelector = createAsyncSelector(
  asyncBookCommentIdsSelector,
  commentsCacheSelector,
  (commentIds, commentsCache) => {
  return commentsCache
      .getFor(commentIds)
      .orFetch(() => fetch(`http://example.com/books/comments/${commentIds}`))
  }
)
```

### Easy testing

* Program without having to worry about where your data comes from. This makes for easy testing too, as components don't need data fetching mocked, and neither do selectors.

### Reduce boilerplate

You might a have noticed that we're fetching data, updating the store and showing a loading indicator when its appropriate all without dispatching a single action.

### Caching

* Data requests are cached for a while which prevents duplicated requests.
* No worries about race conditions.
* Chains of dependent async selectors will kick of multiple requests in sequence. The component will receives the data when the final piece of data arrives.
* You can periodically update data by clearing the cache; components will only show a loading indicator when they fetch data because of something the user changed, in all other cases it will show the most recent data from the server.

## Setup

### Store cache definitions

The `async-redux-selector` library provides you with a way to define a _cache definition_ to use in your store. A cache definition defines how data is stored and retrieved from the store. Fortunately, creating a cache definition doesn't require a whole lot of information:

```javascript
// src/store/cache/booksCache.js
export const booksCacheDefinition = createCacheDefinition(
  // Unique cache identifier:
  'books',
  // The location of the cache definition in the store:
  appState => appState.booksCache,
  // A comparison operator to determine if a filter matches results in the cache:
  (left, right) => left === right,
  // A limiter to determine how many items are cached
  defaultLimiter(5)
)
```

A cache definition needs four things:

1. A unique `cacheId` to identify the books cache among all the other possible caches in the store;
2. The location of the cache in the store;
3. A way to check if two filters are the same (to prevent dispatching duplicate requests);
4. The maximum number of items cached.

After creating a cache definition, it provides you with two things: a selector and a reducer:

```javascript
// The Redux reducer
booksCacheDefinition.reducer;

// The store selector
booksCacheDefinition.selector;
```

### Store
We need to implement the `booksCacheDefinition.reducer` in the Redux store:
    
```javascript
// src/store/index.js
import { booksCacheDefinition } from './cache/booksCache';

const reducer = combineReducers({
  ...
  booksCache: booksCacheDefinition.reducer,
  ...
})
```

Now the cache definition's reducer is connected to the store, we can connect our components to the store using the provided selector.

### Connecting components

You are probably familiar with Redux's `connect()` function. This library provides something similar.

```jsx
const PresentationalComponent = props => {
  if (props.books === none) {
    return <>Loading...</>
  }
  
  return (
    <h1>Results for {props.filter}</h1>
    <ul>
      {props.books.map((book, index) => (
        <li key={index}>{book.name}</li>
      ))}
    </ul>
  )
}

function mapAsyncStateToProps(appState) {
  return {
    books: asyncBooksThatMatchFilterSelector(appState)
  }
}

function mapSyncStateToProps(appState) {
  return {
    filter: filterSelector(appState)
  }
}

function mapDispatchToProps(appState) {
  return { }
}

const ContainerComponent = connectAsyncSimple(
  mapAsyncStateToProps,
  mapSyncStateToProps,
  mapDispatchToProps
)(PresentationalComponent)
```

Instead of having one `mapStateToProps` and one `mapDispatchToProps`, this library takes three functions:

* `mapAsyncStateToProps`
* `mapSyncStateToProps`
* `mapDispatchToProps`

`mapDispatchToProps` is the same function you already know. `mapSyncStateToProps` is the default Redux `mapStateToProps` with a slightly different name to show the difference with `mapAsyncStateToProps`, which is new. 

The function `mapAsyncStateToProps` is the one that returns props that are the result from fetching some piece of data from the server. We can't rely on that data being available to us in the component immediately, so instead we might have to wait while the request might be ongoing. That's why we have to check for `props.books === none` in the `PresentationalComponent`, and show `'Loading...'` if that statement is true.

Instead of getting a list of books _right now_, we have to wait for the server to respond with the books. The selector will return the state of the books cache which could be:


1. a value which indicates that the store is empty and no request has been made yet,
2. or a value that indicates that the request for books was made but no response was received yet,
3. or a value that indicates that the response was received (this value also contains the response).


Once this component is hooked up to your async selector(s) and renders, it will trigger a lookup in the store and optionally make a fetch call to retrieve data. All this without tightly coupling components and/or data fetching together.

## TODO

* Docs:
    * Update Benefits
    * Explain `createTrackedSelector()`


## Notes

### [1]
* https://paulgray.net/race-conditions-in-redux/
* https://medium.com/faceyspacey/redux-first-router-data-fetching-solving-the-80-use-case-for-async-middleware-14529606c262
* https://daveceddia.com/where-fetch-data-redux/
* https://github.com/kouhin/redux-dataloader
* https://github.com/brocoders/redux-async-connect
