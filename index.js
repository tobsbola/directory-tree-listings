const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

class TreeNode {
  constructor(path) {
    this.path = path;
    this.children = [];
    this.attributes = {}
  }
}

function buildTree (rootPath) {
  const root = new TreeNode(rootPath);
  const stack = [root];

  while (stack.length) {
    const currentNode = stack.pop();
    if (currentNode) {
      const children = fs.readdirSync(currentNode.path);

      currentNode.attributes = fs.statSync(currentNode.path)
      for (let child of children) {
        const childPath = `${currentNode.path}/${child}`;
        const childNode = new TreeNode(childPath);
        currentNode.children.push(childNode);
        if(fs.statSync(childNode.path).isFile()) {
          childNode.attributes = fs.statSync(childNode.path)
        }
        if (fs.statSync(childNode.path).isDirectory()) {
          stack.push(childNode);
        }
      }
    }
  }
  return root;
}

function showTree(root, depth = 0, finalArr = []) {
    let d = ''
    for(let i = 0; i < depth; i += 1) {
        d += '   ';
    }

    const { size, atime, mtime } = root.attributes;
    finalArr.push({ path: d + root.path, size: `${size / 1024}`+'Bytes' })
    
    for(let j = 0; j < root.children.length; j += 1) {
        showTree(root.children[j], depth + 1, finalArr);
    }

    return finalArr;
}

app.get('/', async (req, res) => {
    res.send({ hi: 'welcome to directory listing system' })
});

app.post('/', async (req, res) => {
    try {
        const { directory } = req.body
        if (!directory) {
            return res.status(422).send({ 
                error: `please supply a 'directory' as body parameter`,
                status_code: 422,
            })
        }

        const result = showTree(buildTree(directory));
        return res.send( result );
    } catch (err) {
        console.log('caaaa', err)
        // res.status(err.status_code).send({ err: err.stack })
        res.status(500).send({ err: err.stack })
    }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server started on PORT: ${port}`)
})
