let express = require('express')
let app = express()
let {open} = require('sqlite')
let path = require('path')
let dbpath = path.join(__dirname, 'covid19India.db')
let sqlite3 = require('sqlite3')
app.use(express.json())

let db = null
let initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server is running')
    })
  } catch (e) {
    console.log(`DB error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBandServer()

function converterS(a) {
  return {
    stateId: a.state_id,
    stateName: a.state_name,
    population: a.population,
  }
}

function converterD(a) {
  return {
    districtId: a.district_id,
    districtName: a.district_name,
    stateId: a.state_id,
    cases: a.cases,
    cured: a.cured,
    active: a.active,
    deaths: a.deaths,
  }
}

//API-1
app.get('/states/', async (request, response) => {
  let dbquery = `
    select *
    from state;`
  let dbresponse = await db.all(dbquery)
  let newArray = []
  for (let i of dbresponse) {
    newArray.push(converterS(i))
  }
  response.send(newArray)
})

//API-2
app.get('/states/:stateId/', async (request, response) => {
  let {stateId} = request.params
  let dbquery = `
  select * 
  from state
  where state_id = ${stateId};`
  let dbresponse = await db.get(dbquery)
  response.send(converterS(dbresponse))
})

//API-3
app.post('/districts/', async (request, response) => {
  let {districtName, stateId, cases, cured, active, deaths} = request.body
  let dbquery = `
  insert into district(district_name,state_id,cases,cured,active,deaths)
  values ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`
  let dbresponse = await db.run(dbquery)
  response.send('District Successfully Added')
})

//API-4
app.get('/districts/:districtId/', async (request, response) => {
  let {districtId} = request.params
  let dbquery = `
  select *
  from district 
  where district_id = ${districtId};`
  let dbresponse = await db.get(dbquery)
  response.send(converterD(dbresponse))
})

//API-5
app.delete('/districts/:districtId/', async (request, response) => {
  let {districtId} = request.params
  let dbquery = `
  delete from district
  where district_id = ${districtId};`
  await db.run(dbquery)
  response.send('District Removed')
})

//API-6
app.put('/districts/:districtId/', async (request, response) => {
  let {districtId} = request.params
  let {districtName, stateId, cases, cured, active, deaths} = request.body
  let dbquery = `
  update district
  set 
  district_name = '${districtName}',
  state_id = ${stateId},
  cases = ${cases},
  cured = ${cured},
  active = ${active},
  deaths = ${deaths}
  where district_id = ${districtId};`
  await db.run(dbquery)
  response.send('District Details Updated')
})

//API-7
app.get('/states/:stateId/stats/', async (request, response) => {
  let {stateId} = request.params
  let dbquery = `
  select 
  sum(cases) as totalCases,
  sum(cured) as totalCured,
  sum(active) as totalActive,
  sum(deaths) as totalDeaths
  from district
  where state_id = ${stateId};`
  let dbresponse = await db.all(dbquery)
  response.send(...dbresponse)
})

//API-8
app.get('/districts/:districtId/details/', async (request, response) => {
  let {districtId} = request.params
  let dbquery = `
  select state.state_name as stateName
  from district natural join state
  where district.district_id = ${districtId};`
  let dbresponse = await db.get(dbquery)
  response.send(dbresponse)
})

module.exports = app
