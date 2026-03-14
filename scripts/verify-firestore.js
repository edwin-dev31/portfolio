import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load service account key
const serviceAccountPath = join(__dirname, '../portfolio-31e-firebase-adminsdk-fbsvc-7a3ffa82f9.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase Admin with service account
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function verifyFirestoreStructure() {
  console.log('🔍 Verifying Firestore structure...\n');
  console.log('Project:', serviceAccount.project_id);
  console.log('=' .repeat(70));

  try {
    // List all root collections
    const collections = await db.listCollections();
    
    if (collections.length === 0) {
      console.log('\n⚠️  No collections found in Firestore');
    } else {
      console.log(`\n✅ Found ${collections.length} collection(s):\n`);
      
      for (const collection of collections) {
        console.log(`\n${'='.repeat(70)}`);
        console.log(`📁 COLLECTION: ${collection.id}`);
        console.log('='.repeat(70));
        
        // Get all documents in the collection
        const snapshot = await collection.get();
        
        if (snapshot.empty) {
          console.log('   ⚠️  Empty collection (no documents)');
        } else {
          console.log(`   ✅ ${snapshot.size} document(s) found\n`);
          
          for (const doc of snapshot.docs) {
            console.log(`   📄 Document ID: "${doc.id}"`);
            console.log('   ' + '-'.repeat(66));
            
            const data = doc.data();
            console.log('   Structure:');
            console.log(JSON.stringify(data, null, 3).split('\n').map(line => '   ' + line).join('\n'));
            
            console.log('\n   📋 Main fields:', Object.keys(data).join(', '));
            
            // Check for subcollections
            const subcollections = await doc.ref.listCollections();
            if (subcollections.length > 0) {
              console.log('   📂 Subcollections:', subcollections.map(sc => sc.id).join(', '));
            }
            
            console.log('');
          }
        }
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ Analysis completed\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

verifyFirestoreStructure().catch(console.error);
