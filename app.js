const express = require('express')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const path = require('path')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'covid19India.db')
let db = null

const initializeDB = async () => {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  })
}

initializeDB()

// GET /states/
app.get('/states/', async (req, res) => {
  const getStatesQuery = `
    SELECT 
      state_id AS stateId,
      state_name AS stateName,
      population
    FROM state;
  `

  const states = await db.all(getStatesQuery)
  res.send(states)
})

// GET /states/:stateId/
app.get('/states/:stateId/', async (req, res) => {
  const {stateId} = req.params

  const getStateQuery = `
    SELECT 
      state_id AS stateId,
      state_name AS stateName,
      population
    FROM state
    WHERE state_id = ?;
  `

  const state = await db.get(getStateQuery, [stateId])
  res.send(state)
})

// POST /districts/
app.post('/districts/', async (req, res) => {
  const {districtName, stateId, cases, cured, active, deaths} = req.body

  const insertDistrictQuery = `
    INSERT INTO district (
      district_name, state_id, cases, cured, active, deaths
    ) VALUES (?, ?, ?, ?, ?, ?);
  `

  await db.run(insertDistrictQuery, [
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  ])

  res.send('District Successfully Added')
})

// GET /districts/:districtId/
app.get('/districts/:districtId/', async (req, res) => {
  const {districtId} = req.params

  const getDistrictQuery = `
    SELECT 
      district_id AS districtId,
      district_name AS districtName,
      state_id AS stateId,
      cases,
      cured,
      active,
      deaths
    FROM district
    WHERE district_id = ?;
  `

  const district = await db.get(getDistrictQuery, [districtId])
  res.send(district)
})

// DELETE /districts/:districtId/
app.delete('/districts/:districtId/', async (req, res) => {
  const {districtId} = req.params

  const deleteQuery = `
    DELETE FROM district
    WHERE district_id = ?;
  `

  await db.run(deleteQuery, [districtId])
  res.send('District Removed')
})

// PUT /districts/:districtId/
app.put('/districts/:districtId/', async (req, res) => {
  const {districtId} = req.params
  const {districtName, stateId, cases, cured, active, deaths} = req.body

  const updateQuery = `
    UPDATE district
    SET 
      district_name = ?,
      state_id = ?,
      cases = ?,
      cured = ?,
      active = ?,
      deaths = ?
    WHERE district_id = ?;
  `

  await db.run(updateQuery, [
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
    districtId,
  ])

  res.send('District Details Updated')
})

// GET /states/:stateId/stats/
app.get('/states/:stateId/stats/', async (req, res) => {
  const {stateId} = req.params

  const statsQuery = `
    SELECT
      SUM(cases) AS totalCases,
      SUM(cured) AS totalCured,
      SUM(active) AS totalActive,
      SUM(deaths) AS totalDeaths
    FROM district
    WHERE state_id = ?;
  `

  const stats = await db.get(statsQuery, [stateId])
  res.send(stats)
})

// GET /districts/:districtId/details/
app.get('/districts/:districtId/details/', async (req, res) => {
  const {districtId} = req.params

  const query = `
    SELECT state.state_name AS stateName
    FROM district
    JOIN state ON district.state_id = state.state_id
    WHERE district.district_id = ?;
  `

  const result = await db.get(query, [districtId])
  res.send(result)
})

module.exports = app
