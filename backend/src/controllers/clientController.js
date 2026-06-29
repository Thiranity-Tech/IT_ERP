const prisma = require("../prisma/client");

const getClients = async (req, res) => {
  try {
    const clients = await prisma.client.findMany();

    res.json(clients);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const createClient = async (req, res) => {
  try {
    const {
      name,
      contactPerson,
      email,
      phone
    } = req.body;

    const client = await prisma.client.create({
      data: {
        name,
        contactPerson,
        email,
        phone
      }
    });

    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const getClientById = async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: {
        id: Number(req.params.id)
      }
    });

    res.json(client);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const updateClient = async (req, res) => {
  try {
    const {
      name,
      contactPerson,
      email,
      phone
    } = req.body;

    const client = await prisma.client.update({
      where: {
        id: Number(req.params.id)
      },
      data: {
        name,
        contactPerson,
        email,
        phone
      }
    });

    res.json(client);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const deleteClient = async (req, res) => {
  try {
    await prisma.client.delete({
      where: {
        id: Number(req.params.id)
      }
    });

    res.json({
      message: "Client deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const searchClients = async (req, res) => {
  try {
    const { q } = req.query;

    const clients = await prisma.client.findMany({
      where: {
        OR: [
          {
            name: {
              contains: q
            }
          },
          {
            contactPerson: {
              contains: q
            }
          }
        ]
      }
    });

    res.json(clients);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
module.exports = {
  getClients,
  createClient,
  getClientById,
  updateClient,
  deleteClient,
  searchClients
};