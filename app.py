from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import os
from flask import Flask, send_from_directory


app = Flask(__name__)
CORS(app)

# Lista de bases de datos disponibles
BASES_DE_DATOS = ['Hiper','Pinguino','LaAnonima', 'Carnave', 'Flaming', 'Frioteka']
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

            with sqlite3.connect(ruta_db) as conn:
                cursor = conn.cursor()

                # Verificar si las columnas 'imagen' y 'condicion_especial' existen
                tiene_imagen = columna_existe(cursor, 'productos', 'imagen')
                tiene_condicion = columna_existe(cursor, 'productos', 'condicion_especial')

                # Construir la consulta
                columnas = ["nombre", "precio"]
                if tiene_imagen:
                    columnas.append("imagen")
                if tiene_condicion:
                    columnas.append("condicion_especial")

                query = f"SELECT {', '.join(columnas)} FROM productos"
                params = ()

                if consulta:
                    query += " WHERE LOWER(nombre) LIKE ?"
                    params = (f"%{consulta}%",)

                cursor.execute(query, params)
                productos = cursor.fetchall()

                for p in productos:
                    resultado = {
                        "db": db_name,
                        "nombre": p[0],
                        "precio": p[1]
                    }
                    idx = 2
                    if tiene_imagen:
                        resultado["imagen"] = p[idx]
                        idx += 1
                    if tiene_condicion:
                        resultado["condicion"] = p[idx]  # Devuelve con el nombre que espera el frontend
                    resultados.append(resultado)

        return jsonify(resultados)

    except Exception as e:
        app.logger.error(f"Error al obtener productos: {e}")
        print(f"Error al obtener productos: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))  # Render asigna el puerto automáticamente
    app.run(host='0.0.0.0', port=port)
