import os
import sys
import json
import io
import xml.etree.ElementTree as ET
import xml.dom.minidom
from flask import Flask, render_template, request, send_file

# Handle paths for PyInstaller or Dev
if getattr(sys, 'frozen', False):
    template_folder = os.path.join(sys._MEIPASS, 'templates')
    static_folder = os.path.join(sys._MEIPASS, 'static')
    app = Flask(__name__, template_folder=template_folder, static_folder=static_folder)
else:
    app = Flask(__name__)

app.secret_key = 'poly_manager_secret'

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/export_pool', methods=['POST'])
def export_pool():
    """
    Takes the current list of users from the frontend 
    and returns it as a downloadable JSON file.
    """
    data = request.json
    users = data.get('users', [])
    
    json_str = json.dumps(users, indent=4)
    mem_file = io.BytesIO(json_str.encode('utf-8'))
    mem_file.seek(0)
    
    return send_file(
        mem_file,
        as_attachment=True,
        download_name='user_pool.json',
        mimetype='application/json'
    )

@app.route('/generate', methods=['POST'])
def generate_xml():
    """
    Generates the Polycom XML configuration file from JSON data.
    """
    try:
        req_data = request.json

        server_config = req_data.get('server_config', {})
        user_config = req_data.get('user_config', {})
        attendants = req_data.get('attendants', [])
        phone_settings = req_data.get('phone_settings', {})

        # 1. Start XML Construction
        root = ET.Element("polycomConfig")

        # Pagination setting (enabled/disabled from Settings tab)
        pagination_enabled = "1" if phone_settings.get('pagination', 'enabled') == 'enabled' else "0"
        ET.SubElement(root, "up", {"up.Pagination.enabled": pagination_enabled})

        # 2. Server & NTP
        ET.SubElement(root, "tcpIpApp.sntp", {
            "tcpIpApp.sntp.address": server_config.get('ntp_server', 'pool.ntp.org'),
            "tcpIpApp.sntp.gmtOffset": "3600"
        })

        # 3. Registration (The Main Line)
        # Use label if provided, otherwise fallback to Extension
        line_label = user_config.get('label') if user_config.get('label') else user_config.get('ext')
        
        ET.SubElement(root, "reg", {
            "reg.1.displayName": user_config.get('name', ''),
            "reg.1.label": line_label,
            "reg.1.address": user_config.get('ext', ''),
            "reg.1.thirdPartyName": user_config.get('ext', ''),
            "reg.1.auth.userId": user_config.get('ext', ''),
            "reg.1.auth.password": user_config.get('password', ''),
            "reg.1.server.1.address": server_config.get('ip', ''),
            "reg.1.server.1.port": server_config.get('port', '5060'),
            "reg.1.server.1.transport": "UDPOnly",
            "reg.1.lineKeys": "1"
        })

        # 4. Attendants (BLF Keys)
        # Spontaneous Call Appearances setting (enabled=1, disabled=0)
        spontaneous_calls = "1" if phone_settings.get('spontaneous_calls', 'enabled') == 'enabled' else "0"

        att_attrs = {
            "attendant.reg": "1",
            "attendant.behaviors.display.spontaneousCallAppearances.normal": spontaneous_calls
        }
        
        for i, att in enumerate(attendants):
            idx = i + 1
            # Determine type: 'automata' is standard for BLF, 'normal' for speed dial
            # We default to automata for this use case
            att_attrs[f"attendant.resourceList.{idx}.address"] = att.get('ext', '')
            att_attrs[f"attendant.resourceList.{idx}.label"] = att.get('name', '')
            att_attrs[f"attendant.resourceList.{idx}.type"] = "automata"

        ET.SubElement(root, "attendant", att_attrs)

        # 5. Output Formatting
        xmlstr = xml.dom.minidom.parseString(ET.tostring(root)).toprettyxml(indent="    ")
        
        # Fix the standard header required by Polycom
        xmlstr = xmlstr.replace('<?xml version="1.0" ?>', '<?xml version="1.0" encoding="utf-8" standalone="yes"?>')
        
        # Create file in memory
        mem_file = io.BytesIO(xmlstr.encode('utf-8'))
        mem_file.seek(0)
        
        # Determine filename
        filename = f"{user_config.get('ext', 'polycom')}.cfg"
        
        return send_file(
            mem_file, 
            as_attachment=True, 
            download_name=filename, 
            mimetype='application/xml'
        )
    except Exception as e:
        print(f"Error generating XML: {e}")
        return str(e), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)