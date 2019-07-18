# async-redux-selector
[![npm version](https://img.shields.io/npm/v/async-redux-selector.svg?style=flat-square)](https://www.npmjs.com/package/async-redux-selector)

## Example

Suppose we have a web application in which the user can search for pets based on some filter. We want to:

* fetch the pets that match this filter from the server whenever the filter changes,
* display a loader while fetching

In applications we were used to building this looks like this:

1. Dispatch an action to persist the new filter to the store;
2. Dispatch an action to show a loader; 
3. Fetch pets from the server;
4. Dispatch an action to persist the received pets to the store;
5. Dispatch an action to hide the loader.

This is a lot of work.

https://paulgray.net/race-conditions-in-redux/

https://medium.com/faceyspacey/redux-first-router-data-fetching-solving-the-80-use-case-for-async-middleware-14529606c262

https://daveceddia.com/where-fetch-data-redux/

https://github.com/kouhin/redux-dataloader

https://github.com/brocoders/redux-async-connect



The downsides of this approach:

It's hard to figure out where to fetch the data. 

We might initiate the request from the filter component. Of course, the filter component has to know which components are visible and what data they require (as we don't want to fetch data this isn't going to be used). This isn't such a big issue in the pet store, but might get pretty complicated for larger applications.

We might also choose to fetch the data from the components where that data is actually used. This would require those components to "watch" the filter for changes. Furthermore, we need to take care not to duplicate requests when two components depend on the same piece of data.

Both these solutions couple the components that render the data and the filter component together.

* The request is initiated from the filter component. This component has to know what data needs to be fetched. For a simple pet store, this might not be problematic, but for complex UI's where different components might 

 , and we're even ignoring the possible race conditions that might occur when the first search request took a very long time to resolve; so long, that the user didn't wait for the results and changed the filter again, which returned before the first request did.




## Cool

* Program without having to worry about where your data comes from. This makes for easy testing too, as components don't need data fetching mocked, and neither do selectors.
* Reduce boilerplate.
* Data requests are cached for a while which prevents duplicated requests.
* No worries about race conditions.
* Chains of dependent async selectors will kick of multiple requests in sequence. The component will receives the data when the final piece of data arrives.
* You can periodically update data by clearing the cache; components will only show a loading indicator when they fetch data because of something the user changed, in all other cases it will show the most recent data from the server.
