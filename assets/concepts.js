// Visual library: groups → concepts → slides.
// To add a concept: put its images in /concepts/<group>/<slug>/ and add an entry below.
// Each slide is { src, caption }. Images can be .svg, .png, .jpg or .webp.
window.CONCEPTS = [
  { id: 'algo-dsa', label: 'Algo & DSA', concepts: [
    { slug: 'two-sum', title: 'Two Sum', summary: 'Brute force vs one pass with a hash map.', slides: [
      { src: '/concepts/algo-dsa/two-sum/1.svg', caption: 'The problem: two indices whose values add up to the target.' },
      { src: '/concepts/algo-dsa/two-sum/2.svg', caption: 'Brute force checks every pair with two pointers, i and j.' },
      { src: '/concepts/algo-dsa/two-sum/3.svg', caption: 'On this input the answer is the very last pair: 10 comparisons.' },
      { src: '/concepts/algo-dsa/two-sum/4.svg', caption: 'A hash map remembers what was seen, so each number needs one lookup.' }
    ], link: '/algo-dsa/two-sum' },
    { slug: 'linked-list', title: 'Linked list', summary: 'Nodes, next pointers, and walking from the head.', slides: [
      { src: '/concepts/algo-dsa/linked-list/1.svg', caption: 'A node holds a value and the address of the next node.' },
      { src: '/concepts/algo-dsa/linked-list/2.svg', caption: 'Nodes chain together; you only ever hold the head.' },
      { src: '/concepts/algo-dsa/linked-list/3.svg', caption: 'cur = cur.next walks forward; the loop stops at null.' }
    ], link: '/algo-dsa/add-two-numbers' },
    { slug: 'prefix-sum', title: 'Prefix sum', summary: 'Running totals and O(1) range sums.', slides: [
      { src: '/concepts/algo-dsa/prefix-sum/1.svg', caption: 'prefix[i] = prefix[i−1] + A[i], built in one pass.' },
      { src: '/concepts/algo-dsa/prefix-sum/2.svg', caption: 'Start with a 0 so the array has n+1 entries and no edge cases.' },
      { src: '/concepts/algo-dsa/prefix-sum/3.svg', caption: 'sum(L…R) = prefix[R+1] − prefix[L]: two lookups, no loop.' }
    ], link: '/algo-dsa/prefix-suffix' }
  ]},
  { id: 'system-design', label: 'System Design', concepts: [
    { slug: 'framework', title: 'Design framework', summary: 'Seven steps that work for any system.', slides: [
      { src: '/concepts/system-design/framework/1.svg', caption: 'Requirements and numbers first, boxes later, trade-offs last.' },
      { src: '/concepts/system-design/framework/2.svg', caption: 'Step 5: the simplest architecture that satisfies the requirements.' },
      { src: '/concepts/system-design/framework/3.svg', caption: 'Step 6: add exactly the component that fixes the bottleneck you found.' }
    ], link: '/system-design/framework' },
    { slug: 'caching', title: 'Caching', summary: 'Cache-aside, TTLs and what belongs in a cache.', slides: [
      { src: '/concepts/system-design/caching/1.svg', caption: 'Cache-aside: check memory first, fall back to the database on a miss.' },
      { src: '/concepts/system-design/caching/2.svg', caption: 'Cache what is read often and written rarely; expire with a TTL.' }
    ]}
  ]},
  { id: 'lld', label: 'LLD', concepts: [] },
  { id: 'gen-ai', label: 'Gen AI', concepts: [] },
  { id: 'frontend-system-design', label: 'Frontend System Design', concepts: [
    { slug: 'virtual-dom', title: 'Virtual DOM', summary: 'A lightweight in-memory copy of the UI, diffed and patched.', slides: [
      { src: '/concepts/frontend-system-design/virtual-dom/1-what-is-virtual-dom.png', caption: 'What is the Virtual DOM: change the state, not the whole page. A lightweight copy of the real DOM kept in memory.' },
      { src: '/concepts/frontend-system-design/virtual-dom/2-real-dom-vs-virtual-dom.png', caption: 'Real DOM vs Virtual DOM: direct updates can touch many nodes; the Virtual DOM diffs first and patches only what changed.' },
      { src: '/concepts/frontend-system-design/virtual-dom/3-how-it-works.png', caption: 'How it works in six steps: state change, render new tree, compare, find differences, patch the real DOM, browser repaints.' },
      { src: '/concepts/frontend-system-design/virtual-dom/4-in-memory.png', caption: 'How it looks in memory: a tree of plain JavaScript objects with type, props and children.' },
      { src: '/concepts/frontend-system-design/virtual-dom/5-code-it-in-javascript.png', caption: 'How to code one: h() creates virtual nodes, render() makes real elements, diff() and patch() apply minimal updates.' }
    ]}
  ]},
  { id: 'frontend-lld', label: 'Frontend LLD', concepts: [] }
];
