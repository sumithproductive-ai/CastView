Fix search functionality in two files.

FILE 1 — ProspectsIndex.tsx

The search state is captured but never 
applied to filteredProspects.

Find:
const filteredProspects = sourceFilters.size > 0
  ? prospects.filter(p => sourceFilters.has(p.source))
  : prospects;

Replace with:

const filteredProspects = prospects
  .filter(p => {
    const matchesSource = sourceFilters.size === 0 
      || sourceFilters.has(p.source);
    const matchesSearch = search.trim() === '' 
      || p.name.toLowerCase()
          .includes(search.trim().toLowerCase());
    const matchesStatus = statusFilter === 'all' 
      || p.status.toLowerCase().replace(' ', '-') 
          === statusFilter;
    return matchesSource && matchesSearch 
      && matchesStatus;
  });

This wires all three active filters — source, 
search text, and status dropdown — into a 
single filter chain. All three work simultaneously.

---

FILE 2 — Roster.tsx

The search state exists but the models array 
is rendered directly with no filtering applied.

Find where the models array is mapped in the 
grid — it will look like:
{models.map((model) => (

Or whatever the roster data array is named.
Find the array name being mapped in the grid 
render, then add a filtered version above 
the return statement:

const filteredModels = models.filter(model => {
  const matchesSearch = search.trim() === ''
    || model.name.toLowerCase()
        .includes(search.trim().toLowerCase());
  const matchesContext = contextFilter === 'all'
    || model.contexts?.some(c => 
        c.toLowerCase() === contextFilter);
  const matchesDivision = divisionFilter === 'all'
    || model.division?.toLowerCase() 
        === divisionFilter;
  return matchesSearch && matchesContext 
    && matchesDivision;
});

Then find the grid map call:
{models.map((model) => (

Replace models with filteredModels:
{filteredModels.map((model) => (

If the roster data array is named something 
other than models — like rosterModels or 
roster — apply the same pattern using the 
actual array name in the file.

Also add a zero-state below the grid for 
when no results match. After the closing 
div of the grid, add:

{filteredModels.length === 0 && (
  <div 
    className="col-span-4 py-[48px] 
    text-center"
    style={{ 
      fontFamily: 'var(--font-mono)', 
      fontSize: '13px', 
      color: '#666660' 
    }}
  >
    No models match "{search}"
  </div>
)}

Apply the same zero-state to 
ProspectsIndex.tsx after its grid:

{filteredProspects.length === 0 && (
  <div 
    className="col-span-4 py-[48px] 
    text-center"
    style={{ 
      fontFamily: 'var(--font-mono)', 
      fontSize: '13px', 
      color: '#666660' 
    }}
  >
    No prospects match "{search}"
  </div>
)}

No other changes to either file.