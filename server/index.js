const express = require("express");
const app = express();
const cors = require("cors");
const secp = require("ethereum-cryptography/secp256k1");
const { sha256 } = require("ethereum-cryptography/sha256");
const {
  toHex,
  utf8ToBytes,
  hexToBytes,
} = require("ethereum-cryptography/utils");
const port = 3042;

app.use(cors());
app.use(express.json());

const balances = {
  "046b7f7e111fe3860716ba5b587caac296ca95bd3134dc792729017ce9fe83a26200439efdac224ff49b98302e4c104419b737737c42bd90ad9df73dbbdd529751": 100,
  "04d61f064753da2c28dfdcfa5eedc4150cec56f7837d6dfdaaa37ee1f034a8fbac5359fec8047c05a9137d72e226baea830e1a576d74fa8a291b3bf5e49d52a443": 50,
  "047f342fa24490cae19d68cff2ef7c3134a8a44b3dc4844a7fc9bdd1d52422e9ac0d672f206e517cde07ed781666933bc52ec4b073c77ffc75443eb89130d78c95": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const { signature, recipient, amount, recoverBit } = req.body;
  const hexSig = hexToBytes(signature);
  const sender = toHex(
    secp.recoverPublicKey(sha256(utf8ToBytes("msg")), hexSig, recoverBit)
  );

  const isSigned = secp.verify(
    hexSig,
    toHex(sha256(utf8ToBytes("msg"))),
    sender
  );

  if (!isSigned) {
    res.status(401).send({ message: "Not verified." });
  }

  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
