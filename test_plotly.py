import plotly.graph_objects as go

fig = go.Figure(data=[go.Bar(
    x=['Styczeń', 'Luty', 'Marzec'],
    y=[10, 20, 30],
    marker_color='#2A5B84',
    marker_line_color='#1E415F',
    marker_line_width=1.5,
    opacity=0.9
)])

fig.update_layout(
    title='Koszty w Q1',
    plot_bgcolor='white',
    font=dict(family="Helvetica, sans-serif", size=14, color="#333"),
    yaxis=dict(gridcolor='#eee', zerolinecolor='#eee', showline=False),
    xaxis=dict(showgrid=False, zerolinecolor='#eee', showline=False)
)

print("Exporting to test_plotly.png...")
fig.write_image("test_plotly.png")
print("Done!")
