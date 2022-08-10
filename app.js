const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
const databasePath = path.join(__dirname, "todoApplication.db");

app.use(express.json());

let db = null;

const initializeDbServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error:${error.message}`);
  }
};
initializeDbServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasPriorityProperties = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperties = (requestQuery) => {
  return requestQuery.status !== undefined;
};
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
        SELECT * FROM todo WHERE todo LIKE '%${search_q}%'
        AND status='${status}'
        AND priority='${priority}'`;
      break;
    case hasStatusProperties(request.query):
      getTodosQuery = `
         SELECT * FROM todo WHERE todo LIKE '%${search_q}'
         AND status='${status}'`;
      break;

    case hasPriorityProperties(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}"
          AND priority='${priority}'`;
      break;
    default:
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';
           `;
  }
  data = await db.all(getTodosQuery);
  response.send(data);
});

app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const getTodosQuery = `
    SELECT * FROM todo WHERE  id=${todoId}`;
  const todo = await db.get(getTodosQuery);
  response.send(todo);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postTodosQuery = `INSERT INTO 
    todo(id,todo,priority,status)
    VALUES(${id},'${todo}','${priority}','${status}')`;
  await db.run(postTodosQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updatedColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updatedColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updatedColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updatedColumn = "Todo";
      break;
  }

  const previousTodoQuery = `SELECT * FROM todo WHERE id=${todoId}`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodoQuery = `UPDATE todo SET todo='${todo}',
    priority='${priority}',
    status='${status}' WHERE id=${todoId}`;
  await db.run(updateTodoQuery);
  response.send(`${updatedColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM  todo WHERE id=${todoId}`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
