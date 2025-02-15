from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import os
from flask import Flask, send_from_directory


app = Flask(__name__)
CORS(app)

# Lista de bases de datos disponibles
BASES_DE_DATOS = ['Hiper','LaAnonima', 'Pinguino', 'Carnave']
BASES_DIR = 'Bases_de_datos'

# Función para verificar si una columna existe en una tabla
def columna_existe(cursor, tabla, columna):
    cursor.execute(f"PRAGMA table_info({tabla})")
    return columna in [info[1] for info in cursor.fetchall()]



@app.route('/')
def servir_pagina():
    return send_from_directory('static', 'index.html')

@app.route('/static/<path:filename>')
def servir_static(filename):
    return send_from_directory('static', filename)

@app.route('/productos', methods=['GET'])
def obtener_productos():
    try:
        consulta = request.args.get('q', '').strip().lower()
        resultados = []

        for db_name in BASES_DE_DATOS:
            ruta_db = os.path.join(BASES_DIR, f"{db_name}.db")

            # Usamos `with` para manejar automáticamente la conexión y evitar fugas de memoria
            with sqlite3.connect(ruta_db) as conn:
                cursor = conn.cursor()

                # Verificar si la columna 'imagen' existe
                tiene_imagen = columna_existe(cursor, 'productos', 'imagen')

                # Consulta optimizada
                query = "SELECT nombre, precio, imagen FROM productos" if tiene_imagen else "SELECT nombre, precio FROM productos"
                params = ()

                if consulta:
                    query += " WHERE LOWER(nombre) LIKE ?"
                    params = (f"%{consulta}%",)

                cursor.execute(query, params)
                productos = cursor.fetchall()

                # Agregar los resultados con el nombre de la base de datos
                for p in productos:
                    resultado = {"db": db_name, "nombre": p[0], "precio": p[1]}
                    resultado["imagen"] = p[2] if tiene_imagen else ""
                    resultados.append(resultado)

        return jsonify(resultados)

    except Exception as e:
        app.logger.error(f"Error al obtener productos: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))  # Render asigna el puerto automáticamente
    app.run(host='0.0.0.0', port=port)