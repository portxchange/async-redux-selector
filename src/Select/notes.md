```javascript
function permutations(index) {
  return [
      { c: `s1: Selector<AppState, P${index}>`, types: [`P${index}`] },
      { c: `s1: Selector<AppState, AsyncSelectorResult<AppState, Command${index}, P${index}>>`, types: [`Command${index}`, `P${index}`] },
      { c: `s1: SelectorWithProps<AppState, Props${index}, P${index}>`, types: [`Props${index}`, `P${index}`] },
      { c: `s1: SelectorWithProps<AppState, Props${index}, AsyncSelectorResult<AppState, Command${index}, P${index}>>`, types: [`Props${index}`, `Command${index}`, `P${index}`] }
  ]
}

function getAllParamsIter(index, total) {
  if (index === total - 1) {
    return permutations(index).map(c => [c])
  } else {
    const curr = permutations(index)
    return curr.flatMap(c => getAllParamsIter(index + 1, total).map(r => [c, ...r]))
  }
}
```

From https://github.com/Microsoft/TypeScript/issues/5254:
```typescript
If you're using this in a conditonal type you can catch that default {} like this:

type CoalesceInfer<T, D> = keyof T extends never ? D : T;
This works because keyof {} === never

So in my case:

type Something<T> = T extends { params?: infer P, query?: infer Q }
    ? {
        params: keyof P extends never ? undefined : ProcessedType<P>
        query: keyof Q extends never ? undefined : ProcessedType<Q>
    }
    : never
```