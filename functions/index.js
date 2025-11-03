const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.createUser = functions.https.onCall(async (data, context) => {
  // Verificar se o usuário é um administrador.
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Você deve estar logado para criar um usuário."
    );
  }

  const callerDoc = await admin
    .firestore()
    .collection("users")
    .doc(context.auth.uid)
    .get();

  if (!callerDoc.exists || callerDoc.data().role !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Você não tem permissão para criar um usuário."
    );
  }

  const { email, password, name, role } = data;

  if (!email || !password || !name || !role) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Faltam dados do usuário obrigatórios."
    );
  }

  try {
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
    });

    await admin.firestore().collection("users").doc(userRecord.uid).set({
      name: name,
      email: email,
      role: role,
    });

    return { result: `Usuário ${email} criado com sucesso` };
  } catch (error) {
    console.error("Erro ao criar novo usuário:", error);
    throw new functions.https.HttpsError("internal", "Erro ao criar novo usuário.");
  }
});

exports.deleteUser = functions.https.onCall(async (data, context) => {
  // Verificar se o usuário é um administrador.
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Você deve estar logado para excluir um usuário."
    );
  }

  const callerDoc = await admin
    .firestore()
    .collection("users")
    .doc(context.auth.uid)
    .get();

  if (!callerDoc.exists || callerDoc.data().role !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Você não tem permissão para excluir um usuário."
    );
  }

  const { uid } = data;

  if (!uid) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "O UID do usuário é obrigatório."
    );
  }

  try {
    await admin.auth().deleteUser(uid);
    await admin.firestore().collection("users").doc(uid).delete();

    return { result: `Usuário ${uid} excluído com sucesso.` };
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    throw new functions.https.HttpsError("internal", "Erro ao excluir usuário.");
  }
});
