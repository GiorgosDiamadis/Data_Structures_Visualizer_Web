const catchAsync = require("../utils/catchAsync");
const mysql = require("mysql");
const { production } = require("../db.config");

const connection = mysql.createPool(production);

module.exports.getWorkspaces = catchAsync(async (req, res) => {
  const { user_id, structure_type } = req.body;

  connection.query(
    `SELECT * FROM workspacelist INNER JOIN workspace ON workspace.workspace_id = workspacelist.workspace_id AND workspace.structure_type="${structure_type}" WHERE workspacelist.user_id=${user_id}`,
    function (err, results, _) {
      if (err) throw err;
      res.send(results);
    }
  );
});

module.exports.createWorkspace = catchAsync(async (req, res) => {
  const { name, data_structure, user_id, structure_type } = req.body;
  const created_at = new Date().toISOString();
  const last_edited = new Date().toISOString();

  connection.query(
    `INSERT INTO workspace(name,data_structure,created_at,last_edited,structure_type) VALUES ("${name}","${data_structure}","${created_at}","${last_edited}","${structure_type}")`,
    function (err, results, _) {
      if (err) throw err;
      const id = results.insertId;
      connection.query(
        `insert into workspacelist(user_id,workspace_id) values(${user_id},${id})`,
        function (err, results, _) {
          if (err) throw err;
          res.send({ id });
        }
      );
    }
  );
});

module.exports.getWorkspace = catchAsync(async (req, res) => {
  const { workspace_id, user_id } = req.body;
  const query = new Promise((res, rej) => {
    connection.query(
      `select * from workspacelist where workspace_id=? and user_id=?`,
      [workspace_id, user_id],
      function (err, result, _) {
        if (err) {
          throw err;
        }

        if (result.length === 0) {
          rej({ error: "You are not authorized!" });
        }
        res();
      }
    );
  });

  await query
    .then((val) => {
      var data = {};

      connection.query(
        `SELECT * FROM workspace WHERE workspace_id=${workspace_id}`,
        async function (err, result, _) {
          if (err) {
            throw err;
          } else {
            data = result;
            connection.query(
              `select * from workspacenodes inner join node on workspacenodes.node_id=node.node_id where workspace_id=${workspace_id}`,

              async function (err, result, _) {
                if (err) {
                  throw err;
                } else {
                  data[0].nodes = [];
                  data[0].nodeIds = [];
                  data[0].children = [];
                  result.map((res) => {
                    data[0].nodes.push(res.node_data);
                    data[0].nodeIds.push(res.node_id);
                  });

                  res.send(data);
                }
              }
            );
          }
        }
      );
    })
    .catch((reason) => res.send(reason));
});

module.exports.deleteWorkspace = catchAsync(async (req, res) => {
  const { workspace_id, user_id } = req.body;

  const query = new Promise((res, rej) => {
    connection.query(
      `select * from workspacelist where workspace_id=? and user_id=?`,
      [workspace_id, user_id],
      function (err, result, _) {
        if (err) {
          throw err;
        }
        console.log(result);

        if (result.length === 0) {
          rej({ error: "You are not authorized!" });
        }
        res();
      }
    );
  });

  await query
    .then((value) => {
      connection.query(
        `select node_id from workspacenodes where workspace_id=${workspace_id}`,
        function (err, result, _) {
          let nodes = [];
          result.forEach((n) => nodes.push(n.node_id));
          console.log(nodes);
          if (nodes.length !== 0) {
            connection.query(
              `delete from edges where src in (?);
              delete from node where node_id in (?);`,
              [nodes, nodes],
              function (err, result, _) {
                if (err) {
                  console.log(err);
                }

                console.log(result);
              }
            );
          }
          connection.query(
            `delete from workspacenodes where workspace_id=?;
             delete from workspacelist where workspace_id=?;
             delete from workspace where workspace_id=?;`,
            [workspace_id, workspace_id, workspace_id],
            function (err, result, _) {
              res.send("Success");
            }
          );
        }
      );
    })
    .catch((reason) => res.send(reason));
});

const addNodesToWorkspace = async (
  workspace_id,
  nodeIds,
  nodes,
  initialNumberOfnodes,
  finalNumberOfNodes
) => {
  const newIds = [];
  if (finalNumberOfNodes >= initialNumberOfnodes) {
    for (i = 0; i < initialNumberOfnodes; i++) {
      if (nodes[i] < Number.MAX_SAFE_INTEGER) {
        const query = new Promise((res, rej) => {
          newIds.push(nodeIds[i]);
          connection.query(
            `update node set node_data=${nodes[i]} where node_id=${nodeIds[i]}`,
            function (err, result, _) {
              if (err) {
                throw err;
              }
              res();
            }
          );
        });
        await query;
      }
    }

    for (i = initialNumberOfnodes; i < finalNumberOfNodes; i++) {
      if (nodes[i] < Number.MAX_SAFE_INTEGER) {
        const query = new Promise((res, rej) => {
          connection.query(
            `insert into node(node_data) values(${
              nodes[i] !== null ? nodes[i] : "NULL"
            })`,
            async function (err, result, _) {
              if (err) {
                console.log(err);
              } else {
                newIds.push(result.insertId);
                await connection.query(
                  `insert into workspacenodes(workspace_id,node_id) values(${workspace_id},${result.insertId})`
                );
                res();
              }
            }
          );
        });
        await query;
      }
    }
  } else if (initialNumberOfnodes > finalNumberOfNodes) {
    for (i = 0; i < finalNumberOfNodes; i++) {
      if (nodes[i] < Number.MAX_SAFE_INTEGER) {
        const query = new Promise((res, rej) => {
          connection.query(
            `update node set node_data=${nodes[i]} where node_id=${nodeIds[i]}`,
            function (err, result, _) {
              if (err) {
                throw err;
              }
              newIds.push(nodeIds[i]);
              res();
            }
          );
        });
        await query;
      }
    }

    for (i = finalNumberOfNodes; i < initialNumberOfnodes; i++) {
      const query = new Promise((res, rej) => {
        connection.query(
          `delete from workspacenodes where workspace_id=${workspace_id} and node_id=${nodeIds[i]}`,

          async function (err, result, _) {
            if (err) {
              console.log(err);
            } else {
              await connection.query(
                `delete from node where node_id=${nodeIds[i]}`
              );
              res();
            }
          }
        );
      });
      await query;
    }
  }
  return newIds;
};
module.exports.loadGraph = catchAsync(async (req, res, next) => {
  const { workspace_id, user_id } = req.body;
  const query = new Promise((res, rej) => {
    connection.query(
      `select * from workspacelist where workspace_id=? and user_id=?`,
      [workspace_id, user_id],
      function (err, result, _) {
        if (err) {
          throw err;
        }

        if (result.length === 0) {
          rej({ error: "You are not authorized!" });
        }
        res();
      }
    );
  });

  await query
    .then((val) => {
      var data = {};

      connection.query(
        `SELECT * FROM workspace WHERE workspace_id=${workspace_id}`,
        async function (err, result, _) {
          if (err) {
            throw err;
          } else {
            data = result;
            connection.query(
              `select * from workspacenodes inner join node on workspacenodes.node_id=node.node_id where workspace_id=${workspace_id}`,

              async function (err, result, _) {
                if (err) {
                  throw err;
                } else {
                  data[0].nodes = [];
                  data[0].nodeIds = [];
                  data[0].children = [];
                  result.map((res) => {
                    data[0].nodes.push(res.node_data);
                    data[0].nodeIds.push(res.node_id);
                  });

                  for (let i = 0; i < data[0].nodes.length; i++) {
                    let q = new Promise((res, rej) => {
                      connection.query(
                        `select * from edges where src=?`,
                        [data[0].nodeIds[i]],
                        function (err, result, _) {
                          if (err) throw err;
                          let ch = [];
                          result.forEach((res) =>
                            ch.push({
                              node: data[0].nodes[
                                data[0].nodeIds.findIndex((i) => i === res.dest)
                              ],
                              weight: res.weight,
                            })
                          );
                          data[0].children.push(ch);

                          res();
                        }
                      );
                    });
                    await q;
                  }

                  console.log("Load graph => children", data[0].children);

                  res.send(data);
                }
              }
            );
          }
        }
      );
    })
    .catch((reason) => res.send(reason));
});
module.exports.saveGraph = catchAsync(async (req, res, next) => {
  let {
    workspace_id,
    nodeIds,
    nodes,
    user_id,
    initialNumberOfnodes,
    finalNumberOfNodes,
    deletedEdges,
  } = req.body;
  console.log(
    `init - ${initialNumberOfnodes} ==== fin - ${finalNumberOfNodes}`
  );
  console.log("nodeIds = ", nodeIds);
  const query = new Promise((res, rej) => {
    connection.query(
      `select * from workspacelist where workspace_id=? and user_id=?`,
      [workspace_id, user_id],
      function (err, result, _) {
        if (err) {
          throw err;
        }
        if (result.length === 0) {
          rej({ error: "You are not authorized!" });
        }
        res();
      }
    );
  });

  await query.then(async () => {
    let gr_nodes = [];
    nodes.forEach((n) => {
      gr_nodes.push(n.node);
    });
    deletedEdges.forEach(async (del_edge) => {
      let query = new Promise((res, rej) => {
        console.log(
          `delete edge ${nodeIds[del_edge.source]} - ${
            nodeIds[del_edge.target]
          }`
        );
        connection.query(
          `delete from edges where src=? and dest=?`,
          [nodeIds[0], nodeIds[1]],
          function (err, result, _) {
            if (err) throw err;
            console.log(result);
            res();
          }
        );
      });
      await query;
    });

    let newIds = await addNodesToWorkspace(
      workspace_id,
      nodeIds,
      gr_nodes,
      initialNumberOfnodes,
      finalNumberOfNodes
    );

    nodes.forEach((n) => {
      n.neighbors.forEach(async (neigh) => {
        if (neigh) {
          let query = new Promise((res, rej) => {
            connection.query(
              `insert into edges(src,dest,weight) values(${
                newIds[nodes.findIndex((node) => node.node === n.node)]
              },${
                newIds[nodes.findIndex((node) => node.node === neigh.node)]
              },${
                neigh.weight
              }) on duplicate key update src=values(src) ,dest=values(dest), weight=values(weight)`,
              function (err, result, _) {
                if (err) throw err;
                console.log("Insert edge result", result);
                res();
              }
            );
          });
          await query;
        }
      });
    });

    res.send(newIds);
  });
});

module.exports.saveDataStructure = catchAsync(async (req, res) => {
  const {
    workspace_id,
    nodeIds,
    nodes,
    user_id,
    initialNumberOfnodes,
    finalNumberOfNodes,
  } = req.body;
  console.log(
    `saveDataStructure => initNumNodes=${initialNumberOfnodes} - finalNumNodes=${finalNumberOfNodes}`
  );

  let newIds = [];
  const query = new Promise((res, rej) => {
    connection.query(
      `select * from workspacelist where workspace_id=? and user_id=?`,
      [workspace_id, user_id],
      function (err, result, _) {
        if (err) {
          throw err;
        }
        console.log(result);

        if (result.length === 0) {
          rej({ error: "You are not authorized!" });
        }
        res();
      }
    );
  });

  await query
    .then(async () => {
      newIds = await addNodesToWorkspace(
        workspace_id,
        nodeIds,
        nodes,
        initialNumberOfnodes,
        finalNumberOfNodes
      ).then((newIds) => {
        res.send(newIds);
        return;
      });
    })
    .catch((reason) => {
      res.send(reason);
      return;
    });
});
