const express = require('express')
const app = express();
const admin = require("firebase-admin");
const cors=require('cors');
const port =process.env.PORT ||5000



app.use(cors());
app.use(express.json());
require('dotenv').config();

const { MongoClient, Admin } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9jcrs.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function verifyToken(req,res,next){
  if(req.headers?.authorization?.startswith('Bearer')){
    const token = req.headers.authorization.split(' ')[1];
    try{
      const decodedUser=await admin.auth().verifyIdToken(token);
      req.decodedEmail=decodedUser.email;
    }
    catch{
  
    }
  }
  
  next()
}

async function run(){
    try{
        await client.connect();
        const database=client.db('simple_seller');
        const appointmentsCollection=database.collection('appointments')
        const usersCollection=database.collection('user')
        ;

        app.get('/appointments',async( req,res)=>{
          const email=req.query.email;
          const query={email:email};
          const cursor=appointmentsCollection.find(query);
          const appointments=await cursor.toArray();
          res.json(appointments)
        });

        app.post('/appointments',async (req,res)=>{
          const appointment=req.body;
          const result=await appointmentsCollection.insertOne(appointment);
          res.json(result)

        });
        app.get('/users/:email',async(req,res)=>{
            const email=req.params.email;
            const query={email:email};
            const user=await usersCollection.findOne(query);
            let isAdmin=false;
            if(user?.role==='admin'){
              isAdmin=true
            }
            res.json({admin:isAdmin});
        })
        app.post('/users',async(req,res)=>{
          const user=req.body;
          const result=await usersCollection.insertOne(user);
          console.log(result)
          res.json(result)
         
        });
        app.get('/users',async(req,res)=>{
          const cursor=appointmentsCollection.find({});
          const producet=await cursor.toArray();
          res.send(producet)
        })
        app.post('/users',async(req,res)=>{
          const producet=req.body;
          console.log('hit the post',producet)
          const result=await appointmentsCollection.insertOne(producet)
          res.json(result)

        })

        app.put('/users',async(req,res)=>{
          const user=req.body;
          const filter={email:user.email};
          const options={upsert:true};
          const updateDoc={$set:user};
          const result=await usersCollection.updateOne(filter,updateDoc,options);
          res.json(result)

        });

        app.delete('/users/:id',async(req,res)=>{
          const id=req.params.id;
          const query={_id:ObjectId(id)};
          const result=await appointmentsCollection.deleteOne(query);
          res.json(result)
        })


        app.put('/users/admin',verifyToken,async(req,res)=>{
          const user=req.body;
          console.log('put',req.decodedEmail)
          const filter={email:user.email};
          const updateDoc={$set:{role:'admin'}};
          const result=await usersCollection.updateOne(filter,updateDoc);
          res.json(result)
        })
    }
    finally{
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello simple server!')
})

app.listen(port, () => {
  console.log(` listening at ${port}`)
})