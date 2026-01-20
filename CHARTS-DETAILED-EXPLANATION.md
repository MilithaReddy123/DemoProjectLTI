File: src/main.ts (charts related lines)

Line 1: import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
This line is bringing in a function called platformBrowserDynamic from the Angular framework. The curly braces mean we are importing a named export. The string '@angular/platform-browser-dynamic' is the name of the Angular package that contains this function. platformBrowserDynamic is used to start (bootstrap) the Angular application when we run it in a web browser. This line is required so that later we can call platformBrowserDynamic().bootstrapModule(...), which actually launches the whole app, including the charts page. Without this import, the TypeScript code would not know what platformBrowserDynamic is, and the application would not start.

Line 2: import { Chart } from 'chart.js';
This line imports the Chart class from the chart.js library. chart.js is a popular JavaScript charting library. The Chart class is the main object used internally by PrimeNG’s p-chart component to draw charts on a canvas. Here we import it so that we can register a custom plugin later. Registering a plugin changes the behavior of all charts created by Chart.js, which is how we draw the state names outside the pie chart slices. If we did not import Chart, we would not be able to call Chart.register to attach our custom plugin.

Line 3: import { AppModule } from './app/app.module';
This line imports the root Angular module of the application, called AppModule, from the local file ./app/app.module. The ./ at the start means “from the current directory”. app/app.module is the TypeScript file where the main Angular module is defined, including declarations and imports for components like the charts page and the home page. We need AppModule here so that we can pass it to platformBrowserDynamic().bootstrapModule(AppModule), which tells Angular which module to start. This indirectly enables the charts component to be created and rendered.

Line 4: Chart.register({
This line starts a call to Chart.register, passing an object literal. Chart.register is a Chart.js method that allows us to add plugins or other components. By passing an object, we are defining a plugin. The plugin will be known by an id and will contain hook functions that Chart.js calls during the chart drawing process. Using a plugin is what lets us customize how labels and pointing lines are drawn for the pie chart. Without this registration, our custom labeling and lines would not appear; the pie chart would only show default Chart.js behavior.

Line 5:   id: 'pieOutLabels',
This line defines a property called id on the plugin object. The id is set to the string 'pieOutLabels'. This id uniquely identifies our plugin inside Chart.js. It is mainly used by Chart.js internally and can also be used if we want to enable or disable this plugin via chart options. The word pieOutLabels is chosen to describe what the plugin does: it draws labels outside a pie chart. Giving the plugin an id is required by Chart.js so that it can refer to this plugin and avoid duplicate registrations.

Line 6:   afterDatasetDraw(chart, args, pluginOptions) {
This line defines a method named afterDatasetDraw inside our plugin object. In Chart.js, afterDatasetDraw is a “hook” function that runs after a dataset has been drawn onto the canvas. The three parameters have these meanings:
chart: this is the Chart instance currently being drawn. It contains information about the type of chart (pie, bar, etc.), data, and internal state.
args: this is an object that contains information about the dataset that was just drawn, including the dataset index.
pluginOptions: this is an object that contains any configuration passed for this plugin from chart options (for example, the line length and color).
By defining this method, we tell Chart.js that after it draws the pie slices, it should call our function. Inside this function we will draw the pointing lines and the state names. This method directly affects how the chart looks, by drawing extra graphics and text on top of the pie.

Line 7:     const cfg: any = chart.config;
This line creates a constant named cfg and assigns it chart.config. The colon any is a TypeScript type annotation that tells the compiler “treat cfg as any type”. The chart.config object holds the full configuration for this chart, including the type and options. We store it into cfg for convenience and to avoid TypeScript errors when accessing properties like cfg.type, because we are not giving a strict type here. This line does not directly affect the visible chart; it just prepares a reference we use in the next check.

Line 8:     if (cfg.type !== 'pie') return;
This line checks whether the chart type is 'pie'. cfg.type is the chart type stored in the configuration. The !== operator means “not equal”. If the type is not 'pie', we immediately return from the function, which stops further execution of the plugin for this chart. This is important because we only want to draw outside labels and lines for pie charts, not for bar charts (like the hobbies and interests charts). Without this guard, the plugin would run for bar charts too, probably drawing strange lines and text in the wrong place.

Line 9:     const meta = chart.getDatasetMeta(args.index);
This line calls chart.getDatasetMeta with args.index and stores the result into a constant named meta. args.index is the numeric index of the dataset that was just drawn. For a simple pie chart we normally have only one dataset, so the index is usually 0. getDatasetMeta returns metadata describing how Chart.js has rendered that dataset, including an array of elements representing each slice of the pie. We need this metadata to know where each slice is drawn so that we can attach a line and a label at the correct location. Without meta, we would not know the exact angles and positions of the slices.

Line 10:     if (!meta?.data?.length) return;
This line is a safety check. It uses optional chaining (the ? characters) to safely look at meta.data and its length. meta?.data means “if meta exists, then access its data property; otherwise return undefined”. Similarly, meta?.data?.length checks that data exists and has a length. The ! operator negates the value, so if there is no data or length is zero, the condition is true and we return early. This prevents runtime errors in cases where the chart might not have data yet. Visually, if there are no slices, we do nothing instead of trying to draw labels on nonexistent slices.

Line 11:     const opts: any = pluginOptions || {};
This line creates a constant named opts and assigns it either pluginOptions or an empty object. The || operator means “or”, so if pluginOptions is truthy (provided), opts references it; otherwise opts is {}. The : any type says we are not restricting the shape of opts. This is how we read configuration values passed in from chart options (for example line length, font size, etc.). If no options are provided for the plugin, we safely fall back to the empty object and use default values later.

Line 12:     const ctx = chart.ctx;
This line creates a constant named ctx and assigns it chart.ctx. In Chart.js, chart.ctx is the 2D drawing context of the canvas element. It is similar to a “pen” that we can use to draw lines and text directly. We store it in ctx for shorter and clearer usage later. Everything we draw (lines from slices, labels, etc.) is done using ctx. This line is essential for any custom drawing.

Line 13:     const labels = (chart.data.labels || []) as any[];
This line creates a constant named labels. It takes chart.data.labels if that exists; otherwise it uses an empty array. The parentheses group the expression. chart.data.labels is the array of labels we configured in the ChartData object (state names). The as any[] part is a TypeScript cast that tells the compiler “treat this as an array of any”. We then use these labels to know what text to draw next to each slice. If labels is empty, there will be no text for that slice.

Line 14:     const lineLen = Number(opts.lineLength ?? 18);
This line defines a constant named lineLen, which represents the radial length of the first segment of the pointing line (the part going outward from the slice). The Number(...) function converts its argument into a number type. Inside, opts.lineLength ?? 18 uses the nullish coalescing operator ??, which means “use opts.lineLength if it is not null or undefined, otherwise use 18”. So if the plugin options specify lineLength, we use that; otherwise we default to 18 pixels. Increasing this value makes the line stick out farther from the pie before bending; decreasing it keeps it closer.

Line 15:     const elbowLen = Number(opts.elbowLength ?? 10);
This line defines a constant named elbowLen, which is the horizontal length of the second segment of the pointing line, after the bend. It uses the same pattern as lineLen: convert opts.elbowLength to a number, or default to 10. This determines how far left or right the label is from the point where the line bends. A larger number moves labels further horizontally away from the pie, giving more space to the text.

Line 16:     const fontSize = Number(opts.fontSize ?? 11);
This line defines fontSize, the size of the text we will draw, in pixels. It uses opts.fontSize if provided; otherwise it falls back to 11. This affects how large the state names appear around the pie. A larger number makes text bigger and more readable but requires more space; a smaller number makes it more compact.

Line 17:     const lineWidth = Number(opts.lineWidth ?? 1);
This line defines lineWidth, which controls how thick the pointing lines are. It uses opts.lineWidth or defaults to 1 pixel. This value is later assigned to ctx.lineWidth. A larger value (for example 2) makes the lines bolder; a smaller value makes them thinner.

Line 18:     const color = String(opts.color ?? '#444');
This line defines color, the color used both for the line strokes and the label text. It converts opts.color or the default '#444' into a string. The '#444' is a dark gray in hexadecimal color format. This color gives a subtle but visible contrast against the light background and colored slices. Using a string conversion ensures we always have a string to assign to canvas styles.

Line 19:     const maxChars = Number(opts.maxChars ?? 14);
This line defines maxChars, the maximum number of characters we will allow for a label before truncating it. It uses opts.maxChars if provided, or 14 by default. If a label is longer than this and is not the special case we handle, we will cut it and add dots. This prevents very long state names from overflowing outside the card.

Line 20:     const radiusFactor = Number(opts.radiusFactor ?? 0.85);
This line defines radiusFactor, which is a multiplier applied to the slice’s outer radius to calculate where the line starts. It uses opts.radiusFactor if provided or 0.85 by default. Values less than 1.0 move the starting point slightly inward from the slice edge; values closer to 1.0 move it closer to the outer border. This helps fine-tune the balance between having enough spacing and keeping lines inside the card.

Line 21:     ctx.save();
This line calls ctx.save(), which saves the current drawing state of the canvas context. The drawing state includes properties such as strokeStyle, fillStyle, lineWidth, font, textAlign, and others. We do this before setting our own drawing styles so that we can restore the original ones later. It prevents our plugin from permanently changing styles that other parts of Chart.js rely on. Using save and restore around custom drawing is a standard practice.

Line 22:     ctx.strokeStyle = color;
This line sets the strokeStyle property of the 2D context to the previously determined color. strokeStyle defines the color used to draw outlines and lines. Because we draw the pointing lines with ctx.stroke(), this color is what the lines will appear as. Using the same color for stroke and text makes the lines and labels visually consistent.

Line 23:     ctx.fillStyle = color;
This line sets fillStyle to the same color. fillStyle is the color used when we draw and fill text with ctx.fillText. Because we want the labels to have the same color as the lines, we assign the same value. This helps make the labels readable and visually connected to their corresponding lines.

Line 24:     ctx.lineWidth = lineWidth;
This line sets the lineWidth property of the context to the value we calculated earlier. This controls how thick the pointing lines will be when ctx.stroke() is called. This line directly affects the visual thickness of the leader lines around the chart.

Line 25:     ctx.font = `600 ${fontSize}px Arial`;
This line sets the font property of the context to a specific font description. The backtick quotes create a template string. 600 is a numerical font weight, meaning semi-bold. ${fontSize}px inserts the numeric fontSize value followed by 'px', so for example '11px'. Arial is the font family. So if fontSize is 11, the full string becomes '600 11px Arial'. This determines how text is drawn for the labels: a semi-bold Arial font with the desired size. It affects how readable and compact the state names appear.

Line 26:     meta.data.forEach((arc: any, i: number) => {
This line starts a forEach loop over meta.data. meta.data is an array where each item corresponds to a visual element of the dataset; in a pie chart, each item is a slice. The function takes two parameters:
arc: the element representing the individual slice. It has methods and properties describing its geometry.
i: the index of the slice in the dataset (0 for the first slice, 1 for the second, etc.).
forEach will call our function once for each slice. This is how we ensure that every state slice gets its own line and label. The type annotations (arc: any, i: number) tell TypeScript what types we expect.

Line 27:       const p = arc.getProps(['x', 'y', 'startAngle', 'endAngle', 'outerRadius'], true);
This line calls arc.getProps with an array of property names and the boolean true, assigning the result to p. getProps is a Chart.js internal helper that retrieves the current animated values of certain properties. Here we request:
x: the x-coordinate of the center of the pie.
y: the y-coordinate of the center of the pie.
startAngle: the starting angle of this slice in radians.
endAngle: the ending angle of this slice in radians.
outerRadius: the outer radius of the slice.
The true parameter tells Chart.js to get the current animated values, taking any ongoing animation into account. p becomes an object with these fields. We use them to compute positions for lines and labels.

Line 28:       const angle = (p.startAngle + p.endAngle) / 2;
This line calculates angle, the midpoint angle of the slice, by adding startAngle and endAngle and dividing by 2. This gives us the direction in which the slice points outward from the center. It is used to compute the positions of the line and label so they are centered relative to the slice. If we did not compute this average, labels could appear aligned with the start or end of the slice, which would look uneven.

Line 29:       const cos = Math.cos(angle);
This line computes the cosine of the angle using the Math.cos function. The cosine is the x-component of a unit vector pointing in that direction. We will multiply this value by a radius to obtain actual x offsets from the center. This is a standard trigonometric technique used when converting polar coordinates to Cartesian coordinates.

Line 30:       const sin = Math.sin(angle);
This line computes the sine of the angle, which is the y-component of the unit vector pointing at the slice’s center. Like cos, we will multiply sin by a radius to get y offsets. By using both cos and sin, we can calculate exact (x,y) positions along the direction of the slice.

Line 31:       const r = p.outerRadius * radiusFactor;
This line calculates r, which is the radius where we want the line to start. It multiplies the outerRadius from the slice by the previously defined radiusFactor. For example, if outerRadius is 100 and radiusFactor is 0.85, r becomes 85. This pulls the line’s start point slightly inward from the extreme edge, which helps keep labels and lines within the card and avoids overlapping the border of the pie.

Line 32:       const x1 = p.x + cos * r;
This line computes x1, the x-coordinate where the line starts, by taking the chart center x (p.x) and adding cos * r. Because cos is the horizontal component of the direction and r is the chosen radius, this computes a point on the slice at radius r.

Line 33:       const y1 = p.y + sin * r;
This line computes y1, the y-coordinate of the line’s starting point, in the same way using sin and r. Together x1 and y1 specify the first end of the line, attached to the slice.

Line 34:       const x2 = p.x + cos * (r + lineLen);
This line calculates x2, the x-coordinate of the elbow point where the line bends. It uses a radius of r + lineLen, which is a bit farther out from the slice. The extra lineLen moves the line outward in the same direction as the slice. This determines where the bend occurs horizontally.

Line 35:       const y2 = p.y + sin * (r + lineLen);
This line calculates y2, the y-coordinate of the elbow point, using the same radius r + lineLen. Together x2 and y2 define the point where the line turns from radial to horizontal.

Line 36:       const x3 = x2 + (cos >= 0 ? elbowLen : -elbowLen);
This line computes x3, the final x-coordinate where the label will align. It checks whether cos is greater than or equal to 0. If cos is non-negative, the slice is on the right half of the pie, so we want the horizontal line and label to extend to the right; we add elbowLen. If cos is negative, the slice is on the left side, so we subtract elbowLen to extend to the left. This keeps labels placed outside the pie, on whichever side the slice is located.

Line 37:       const y3 = y2;
This line sets y3 equal to y2. That means the horizontal part of the line and the text share the same vertical level. So the line goes out from (x1,y1) to (x2,y2), then horizontally from (x2,y2) to (x3,y2), and the text is drawn aligned with y3, which equals y2.

Line 38:       ctx.beginPath();
This line starts a new path on the canvas context. A path is a sequence of lines and shapes that you later stroke or fill. Calling beginPath ensures any previous path is cleared, so we only draw the lines for this slice when we call stroke.

Line 39:       ctx.moveTo(x1, y1);
This line moves the drawing cursor to the point (x1,y1), which we earlier computed at the slice. It does not draw anything yet, it just sets the starting point for the next line.

Line 40:       ctx.lineTo(x2, y2);
This line adds a straight line segment from the current point (x1,y1) to the new point (x2,y2). This draws the radial segment of the pointing line from the slice towards the outside.

Line 41:       ctx.lineTo(x3, y3);
This line adds another line segment from (x2,y2) to (x3,y3). This is the horizontal “elbow” that shifts the line toward the label position.

Line 42:       ctx.stroke();
This line actually draws the path we defined (from x1,y1 to x2,y2 to x3,y3) onto the canvas, using the current strokeStyle and lineWidth. This is when the pointing line becomes visible. The line color and thickness we set earlier now take effect visually.

Line 43:       let text = String(labels[i] ?? '');
This line defines a variable named text and assigns it the string version of labels[i] or an empty string if labels[i] is null or undefined. labels[i] is the label for the current slice (for example 'Telangana' or 'Andhra Pradesh'). The String(...) function ensures that even if the label is not a string, we convert it to one. This text is what we will draw next to the line.

Line 44:       const isTwoLine = text === 'Andhra Pradesh';
This line creates a boolean variable isTwoLine that is true when the text equals the exact string 'Andhra Pradesh'. This is a special case for a long label that tends to overflow. When this is true, we will draw the label in two lines ("Andhra" and "Pradesh") instead of one, which helps keep it inside the card and avoid overlap.

Line 45:       if (!isTwoLine && maxChars > 3 && text.length > maxChars) {
This line begins an if statement that checks three conditions:
!isTwoLine: ensures we do not apply truncation to the special two-line label.
maxChars > 3: makes sure the limit is meaningful; if it were very small we might not want to apply it.
text.length > maxChars: checks whether the label is longer than the allowed maximum.
Only if all three are true do we go inside the block. This prevents long labels (except the special case) from overflowing by truncating them.

Line 46:         text = text.slice(0, maxChars - 3) + '...';
This line shortens the text when the if condition is met. text.slice(0, maxChars - 3) takes a substring from index 0 up to maxChars minus 3. We subtract 3 to keep space for the three dots '...'. Then we append '...' to show that the label has been cut. For example, if maxChars is 16 and the label is 'Madhya Pradesh State', it might become 'Madhya Prades...'. This keeps labels shorter and inside the visual area.

Line 47:       }
This line closes the if block that handles truncation.

Line 48:       ctx.textAlign = cos >= 0 ? 'left' : 'right';
This line sets the textAlign property of the context. If cos is >= 0 (slice on the right), we set textAlign to 'left', meaning that the text will extend to the right from the given x coordinate. If cos is negative (slice on the left), we set textAlign to 'right', meaning the text will extend to the left from the x coordinate. This ensures that text always appears away from the pie, not overlapping the line.

Line 49:       ctx.textBaseline = 'middle';
This line sets textBaseline to 'middle', which means that the y coordinate given to fillText will be at the vertical center of the text. This helps center the label relative to the line y position.

Line 50:       const xText = x3 + (cos >= 0 ? 4 : -4);
This line calculates xText, the x-coordinate where we will draw the text. It takes x3 and shifts it a little: if the slice is on the right (cos >= 0), we add 4 pixels to move the text a bit to the right of the end of the line; if on the left, we subtract 4 pixels to move it slightly left. This small gap prevents the text from touching the line.

Line 51:       if (isTwoLine) {
This line starts an if block that handles the special multi-line label case. If isTwoLine is true, we will draw two lines of text instead of one.

Line 52:         const parts = ['Andhra', 'Pradesh'];
This line defines parts as an array containing two strings: 'Andhra' and 'Pradesh'. These are the two words we will draw on separate lines for the label 'Andhra Pradesh'.

Line 53:         const lineHeight = fontSize + 2;
This line defines lineHeight, which is the vertical distance between the two text lines. It uses the fontSize plus 2 extra pixels as padding. This ensures the two words do not overlap and are nicely spaced.

Line 54:         const yStart = y3 - lineHeight / 2;
This line calculates yStart, the y position of the first text line. It subtracts half the lineHeight from y3 so that when we draw the two lines (at yStart and yStart + lineHeight), the overall vertical center stays close to y3. This keeps the pair of lines centered around the line end.

Line 55:         parts.forEach((part, idx) => {
This line starts a forEach loop over the parts array. It passes a function that receives part (the word string) and idx (its index, 0 or 1). We will use this to draw each word on its own line.

Line 56:           ctx.fillText(part, xText, yStart + idx * lineHeight);
This line calls ctx.fillText to draw each word. For idx 0 ("Andhra"), the y coordinate is yStart. For idx 1 ("Pradesh"), the y coordinate is yStart + lineHeight. xText is the horizontal position we computed earlier. Using fillText actually renders the text to the canvas. This results in a two-line label stacked vertically.

Line 57:         });
This line closes the forEach loop over parts.

Line 58:       } else {
This line begins the else branch. If isTwoLine is false, we execute this branch to draw the label as a single line.

Line 59:         ctx.fillText(text, xText, y3);
This line draws the single-line label at position (xText, y3). Because textAlign is left or right and textBaseline is middle, the text appears centered vertically on the line end and extending away from the pie. This is how most state names are drawn.

Line 60:       }
This line closes the if-else block handling the single-line vs two-line labels.

Line 61:     });
This line closes the forEach loop over the slices. At this point, for every slice of the pie, we have drawn a pointing line and a label.

Line 62:     ctx.restore();
This line calls ctx.restore(), which restores the canvas drawing state that we saved earlier with ctx.save(). It resets strokeStyle, fillStyle, font, lineWidth, and other properties back to what they were before our plugin ran. This prevents our custom settings from affecting other parts of Chart.js drawing (like legends or tooltips).

Line 63:   }
This line closes the afterDatasetDraw method definition.

Line 64: });
This line closes the object passed to Chart.register and the call itself. At this moment, Chart.js has registered our plugin globally. Any pie chart created by Chart.js will now run this plugin after drawing its dataset, as long as it is not disabled.

Line 65: platformBrowserDynamic().bootstrapModule(AppModule)
This line calls platformBrowserDynamic(), which returns a platform object for running Angular in the browser, and then immediately calls bootstrapModule(AppModule) on it. bootstrapModule tells Angular to start the application using AppModule as the root module. This triggers Angular to create all components (including the charts component when its route is visited). Without this line, the Angular app would never start, and the charts would never appear.

Line 66:   .catch(err => console.error(err));
This line attaches a catch handler to the Promise returned by bootstrapModule. If something goes wrong during bootstrapping (for example, a module fails to load), the error is caught and logged to the browser console using console.error. This does not change how charts look when things work correctly, but it helps diagnose problems if the app fails to start.


File: src/app/pages/charts/charts.component.ts

Line 1: import { Component, OnInit } from '@angular/core';
This line imports two symbols from Angular’s core package: Component and OnInit. Component is a decorator function used to define an Angular component class, tying together the template, styles, and logic. OnInit is an interface describing a lifecycle hook; classes that implement it provide an ngOnInit method that Angular calls once after the component is created. We use these to define the charts component and to run code when it initializes.

Line 2: import { Router } from '@angular/router';
This line imports the Router service from Angular’s router package. Router is used to navigate between routes (pages) in the application. In this component, we use Router to navigate back to the home page when the user clicks the Back button. It does not directly change the chart, but it affects navigation.

Line 3: import { forkJoin } from 'rxjs';
This line imports forkJoin from the rxjs library (Reactive Extensions for JavaScript). forkJoin is a function that combines multiple Observables and waits for all of them to complete, returning their last values together. We use forkJoin to call three HTTP requests (states, hobbies, tech interests) simultaneously and then process all results once, which is efficient and keeps our code short.

Line 4: import { UserService } from '../../services/user.service';
This line imports the UserService class from a relative file path. The ../.. moves up two directories, then we go into services/user.service. UserService is an Angular service that wraps HTTP calls to the backend for user-related operations, including the chart endpoints. We inject this service into the charts component to fetch the aggregated chart data.

Line 5: import { MessageService } from 'primeng/api';
This line imports MessageService from PrimeNG’s api module. MessageService is used to show toast notifications (small popup messages) on the screen. In this component we use it to display an error toast if chart data fails to load. It does not directly change the chart visuals, but it improves user feedback.

Line 7: interface ChartData {
This line begins the definition of a TypeScript interface named ChartData. An interface describes the shape of an object. We create this interface to describe the data structure that Chart.js expects for its data property: labels and datasets. Using an interface provides type checking and autocomplete.

Line 8:   labels: string[];
This line defines a property called labels on the ChartData interface. It is an array of strings. Each string is the label for one category in the chart (for example, state names for the pie chart or hobby names for the bar chart). Chart.js uses these labels for axes (for bars) and for legends and tooltips.

Line 9:   datasets: Array<{
This line defines a property datasets, which is an array of objects. The Array<{ ... }> syntax means “array where each element has the structure we define inside the braces”. Each dataset describes one set of numeric values and styling (for example, a series of values for the states). For our charts we use a single dataset for each chart, but Chart.js allows multiple series.

Line 10:     label: string;
This line inside the dataset object describes a label property, which is a string. For the pie chart, label is something like 'Users by States'. For bar charts, it is 'Users'. Chart.js uses this label in legends or tooltips to identify which dataset a value belongs to.

Line 11:     data: number[];
This line defines the data property: an array of numbers. Each number corresponds to a label at the same index. For the states pie chart, each number is the count of users in that state. For the hobbies bar chart, each number is the count of users having that hobby. These values determine the sizes of slices or heights of bars.

Line 12:     backgroundColor?: string | string[];
This line defines an optional property backgroundColor (the question mark means optional). Its type can be either a single string or an array of strings. Each string is a color, typically in hex or rgba format. If an array is provided, each bar or slice gets a color from the array; if a single string is provided, all elements have the same color. We use this to color slices and bars.

Line 13:     borderColor?: string | string[];
This line defines an optional borderColor property, also either a string or array of strings. These colors are used for the outline (border) of slices or bars. Using a white border for slices helps separate them visually. Using a solid border for bars improves contrast.

Line 14:     borderWidth?: number;
This line defines an optional borderWidth property, a number that indicates how thick the border line should be in pixels. A value of 2 means a slightly thicker border; 1 is thin. This affects the visual crispness of slice and bar outlines.

Line 15:   }>;
This line closes the dataset object and the Array type. It indicates that datasets is an array of these objects. The interface definition for ChartData will end shortly.

Line 16: }
This line closes the ChartData interface. Any object typed as ChartData must follow this structure: labels array and datasets array with the defined fields.

Line 18: @Component({
This line starts the Angular Component decorator. @Component is a function that takes an object with configuration for the component. It tells Angular how to instantiate and use this class in the template. Everything inside the parentheses defines metadata.

Line 19:   selector: 'app-charts',
This line sets selector to 'app-charts'. The selector is the HTML tag name Angular uses to insert this component into a template. For example, if we wrote <app-charts></app-charts> inside another component, Angular would render this charts component there. In routing-based apps, Angular uses the router-outlet but the selector still uniquely identifies the component.

Line 20:   templateUrl: './charts.component.html',
This line specifies the path to the HTML template file for this component. './charts.component.html' is a relative path from this TypeScript file. Angular will load that file and use its HTML to render the view for this component. That HTML defines the structure of the dashboard: cards, charts, and layout.

Line 21:   styleUrls: ['./charts.component.css']
This line specifies the path to the CSS file(s) with styles for this component. We provide an array with one string: './charts.component.css'. Angular will apply these styles only to this component’s template (scoped styling). That CSS file controls layout, spacing, and visual appearance of the charts section.

Line 22: })
This line closes the @Component decorator object literal and ends the decorator. Everything after this applies to the ChartsComponent class.

Line 23: export class ChartsComponent implements OnInit {
This line declares and exports the ChartsComponent class. export means the class can be imported and used in other files (for example in AppModule declarations and routing). ChartsComponent implements OnInit, which means it promises to implement an ngOnInit method. Angular will call ngOnInit once after constructing the component, which is where we load chart data. This class contains all logic for the charts page.

Line 24:   stateChartData: ChartData = { labels: [], datasets: [] };
This line defines a property named stateChartData on the ChartsComponent class. It is typed as ChartData and initialized with labels as an empty array and datasets as an empty array. Initially, before data is loaded, there are no labels or values. Later, in ngOnInit, we assign a proper ChartData object built from API results. The p-chart for states binds to this property; when it is updated, the pie chart redraws.

Line 25:   hobbiesChartData: ChartData = { labels: [], datasets: [] };
This line defines hobbiesChartData, also typed as ChartData and initially empty. It will later be filled with labels and values for user hobbies. The hobbies bar chart binds to this property. Using separate properties for each chart keeps their data independent.

Line 26:   techInterestsChartData: ChartData = { labels: [], datasets: [] };
This line defines techInterestsChartData, similar to the above two. It will hold chart data for the user tech interests bar chart. The third p-chart binds to this property.

Line 28:   pieColors = ['#4F81BD', '#9BBB59', '#C0504D', '#8064A2', '#4BACC6', '#F79646', '#2E75B6'];
This line defines a property pieColors, which is an array of string color codes in hexadecimal format. Each value corresponds to a distinct color used for pie slices. For example '#4F81BD' is a blue tone, '#9BBB59' is a green, and so on. When we build the pie chart dataset, we slice this array to match the number of states and assign it to backgroundColor. This provides a fixed color palette for the pie chart.

Line 29:   barColors = ['rgba(79, 129, 189, 0.85)', 'rgba(155, 187, 89, 0.85)', 'rgba(192, 80, 77, 0.85)', 'rgba(128, 100, 162, 0.85)', 'rgba(75, 172, 198, 0.85)', 'rgba(247, 150, 70, 0.85)'];
This line defines barColors, an array of rgba color strings. rgba stands for red, green, blue, alpha (opacity). Each number set defines a color, and 0.85 is the opacity, meaning slightly transparent. When building bar chart datasets, we assign these colors so each bar gets a distinct color. The alpha component lets grid lines and backgrounds subtly show through bars.

Line 31:   chartOptions = {
This line starts the definition of chartOptions, an object literal. This object holds configuration options specific to the pie chart. We will pass this object to the p-chart for the states pie via [options]="chartOptions". Chart.js reads these values to control layout and plugins.

Line 32:     responsive: true,
This line sets responsive to true. In Chart.js, this means the chart will automatically resize when its container or the browser window changes size. The canvas adjusts its width and height to fit the parent element. This keeps the pie chart looking good on different screen sizes.

Line 33:     maintainAspectRatio: false,
This line sets maintainAspectRatio to false. By default, Chart.js keeps a fixed width-to-height ratio for charts. Setting this to false allows the chart to stretch to fill the height of the container (like the .pie-wrapper with a fixed height). This gives more control through CSS for the dashboard layout.

Line 34:     // extra room so outside labels don't clip, but keep them inside card
This line is a comment explaining the next layout property. It states that we want extra padding around the chart so that labels drawn outside the pie do not get cut off, but still stay within the card boundaries. Comments are not executed; they just help humans understand the code.

Line 35:     layout: { padding: { left: 32, right: 90, top: 24, bottom: 24 } },
This line sets the layout.padding option. layout is a group of layout-related options; padding is an object specifying internal padding around the chart area. We give left: 32, right: 90, top: 24, bottom: 24, all in pixels. This pushes the actual pie drawing inward from the canvas edges: 32 pixels from the left, 90 from the right, etc. Because our labels are drawn just outside the pie, this padding ensures labels and lines have space and appear inside the card.

Line 36:     plugins: {
This line opens a plugins object inside chartOptions. In Chart.js, this section configures plugins, including standard ones (like legend and tooltip) and our custom plugin (pieOutLabels). Each key inside plugins corresponds to a plugin id or built-in plugin.

Line 37:       // reference-style: names around the pie with connector lines (drawn by custom plugin in main.ts)
This line is a comment describing that the next property configures our custom plugin, which draws names around the pie with connector lines. It also notes that the drawing logic is in main.ts.

Line 38:       pieOutLabels: { lineLength: 18, elbowLength: 22, fontSize: 11, lineWidth: 2, color: '#444', maxChars: 16, radiusFactor: 0.85 },
This line defines configuration for the custom plugin whose id is 'pieOutLabels'. The value is an object with these properties:
lineLength: 18 – the distance (in pixels) from the slice edge inward/outward before the bend. A value of 18 gives a noticeable radial segment.
elbowLength: 22 – the horizontal part of the line length, moving labels outward; 22 makes labels sit comfortably to the right or left.
fontSize: 11 – the font size for labels; matches what we used when setting ctx.font inside the plugin.
lineWidth: 2 – the thickness of the leader lines; thicker lines are more visible like in the reference image.
color: '#444' – the gray color for both the lines and labels.
maxChars: 16 – the truncation limit for label text (except the 'Andhra Pradesh' special case).
radiusFactor: 0.85 – sets how far from the center the line starts relative to the slice outer radius.
These values are read by the plugin as opts and directly affect label positioning and appearance around the pie.

Line 39:       // legend shows which color maps to which state (vertical on the right)
This comment explains that the legend configuration below will show which color corresponds to which state, arranged vertically on the right side of the chart.

Line 40:       legend: {
This line opens the legend configuration object. The legend is the key that shows colored symbols and labels for each data value.

Line 41:         display: true,
This line sets legend.display to true, meaning the legend should be visible. If it were false, the legend would be hidden. With true, the legend shows small colored dots and text for each state.

Line 42:         position: 'right' as const,
This line sets position to 'right'. This tells Chart.js to place the legend on the right side of the chart area. The “as const” is a TypeScript assertion to treat the string as a literal type, avoiding type widening. Visually, this moves the legend to a vertical column at the right edge of the card.

Line 43:         labels: { usePointStyle: true, boxWidth: 10, padding: 12, font: { size: 12 } }
This line configures how legend labels look:
usePointStyle: true – uses small circles instead of default squares for the colored markers.
boxWidth: 10 – sets the width of the color marker to 10 pixels, making them compact.
padding: 12 – sets the vertical spacing between legend items, giving breathing room.
font: { size: 12 } – sets the legend text size to 12 pixels, slightly larger than labels around the pie for readability.
These attributes affect the visual appearance of the legend only.

Line 44:       },
This line closes the legend object.

Line 45:       tooltip: { enabled: true }
This line configures the tooltip plugin. With enabled: true, tooltips will show when the user hovers or taps on a slice. Chart.js will display the label and value automatically. If we set this to false, hovering on slices would not show a tooltip.

Line 46:     }
This line closes the plugins object inside chartOptions.

Line 47:   };
This line closes the chartOptions object assignment. From now on, chartOptions is a fully configured options object that we pass to the pie p-chart in the template.

Line 51:   barChartOptions = {
This line starts the definition of barChartOptions, another options object, but used for the hobbies and tech interests bar charts. It will be passed via [options]="barChartOptions" to those charts.

Line 52:     responsive: true,
This line sets responsive to true for the bar charts. They will also resize responsively with their containers.

Line 53:     maintainAspectRatio: false,
This line allows bar charts to stretch vertically to match the card layout, similar to the pie chart.

Line 54:     plugins: {
This line opens the plugins object for bar charts.

Line 55:       legend: { display: false },
This line sets the bar chart legend’s display to false, effectively hiding it. Since the bar charts only have one dataset labeled 'Users', and the x-axis labels already show category names, the legend would not add much value. Hiding it keeps the UI cleaner.

Line 56:       tooltip: { callbacks: { label: (ctx: any) => `${ctx.label}: ${ctx.parsed.y || 0}` } }
This line configures the tooltip for bar charts. tooltip.callbacks.label is a function that returns a string used for each tooltip line. It takes ctx (context) as parameter, of type any. Inside the arrow function, we create a template string with ctx.label (the x-axis label, such as 'Music') and ctx.parsed.y (the numeric y value, the count). If ctx.parsed.y is falsy (for example undefined), we use 0 instead. This results in tooltips like "Music: 7". This improves clarity compared to the default formatting.

Line 57:     },
This line closes the plugins object for bar charts.

Line 58:     scales: {
This line opens the scales object, which configures axes for the bar charts.

Line 59:       y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 }, grid: { display: true } },
This line defines the options for the y-axis:
beginAtZero: true – forces the y-axis to start at 0, which is important for bar charts so comparisons make visual sense.
ticks: { stepSize: 1, precision: 0 } – stepSize: 1 tells Chart.js to use increments of 1 between y-axis tick marks; precision: 0 prevents decimal values, making tick labels integers.
grid: { display: true } – shows horizontal grid lines behind the bars, aiding readability of values.

Line 60:       x: { grid: { display: false } }
This line defines x-axis options. It turns off vertical grid lines by setting grid.display to false, so only y-axis grid lines are visible. This keeps the chart less cluttered while still providing necessary reference lines.

Line 61:     }
This line closes the scales object.

Line 62:   };
This line closes the barChartOptions object assignment.

Line 64:   constructor(
This line starts the constructor definition for the ChartsComponent class. The constructor is a special method that runs when Angular creates an instance of this component. Inside parentheses we declare dependencies that Angular should inject.

Line 65:     private userService: UserService,
This line declares a private property userService of type UserService and asks Angular to inject it. The word private is a TypeScript access modifier and automatically creates a class property. userService is used later to call methods like getStateDistribution. Being private means it is only used inside this class.

Line 66:     private messageService: MessageService,
This line declares a private messageService property of type MessageService. Angular will inject the PrimeNG MessageService. We use it in the toast helper to show error messages when data loading fails.

Line 67:     private router: Router
This line declares a private router property of type Router. Angular injects the router service here. We use it in navigateToHome to change routes.

Line 68:   ) {}
This line closes the constructor parameter list and defines an empty constructor body. We do not perform any extra work in the constructor; all initialization happens in ngOnInit. Angular still uses this to inject the services.

Line 70:   ngOnInit(): void {
This line declares the ngOnInit lifecycle hook method, with return type void (it does not return a value). Because the class implements OnInit, Angular will call this method once after constructing and setting up input bindings for the component. We use it to load all chart data.

Line 71:     forkJoin({
This line calls forkJoin with an object argument. forkJoin will subscribe to multiple Observables and collect their final emitted values into an object with the same keys. We choose an object so we get results by name (states, hobbies, techInterests). This call starts the combined HTTP requests when ngOnInit runs.

Line 72:       states: this.userService.getStateDistribution(),
This line defines an entry named states in the object passed to forkJoin. The value is the Observable returned by this.userService.getStateDistribution(). That method makes an HTTP GET call to /users/charts/state and returns an Observable of an array of {label, value}. forkJoin will subscribe to it and later provide the result in the combined response.

Line 73:       hobbies: this.userService.getHobbiesDistribution(),
This line defines a hobbies property in the forkJoin object. It uses userService.getHobbiesDistribution(), which calls /users/charts/hobbies and returns aggregated hobby counts. Again, the Observable will be resolved when the HTTP call finishes.

Line 74:       techInterests: this.userService.getTechInterestsDistribution()
This line defines techInterests in the forkJoin object, using userService.getTechInterestsDistribution(). That method calls /users/charts/tech-interests to obtain counts for tech interests. When all three Observables complete, forkJoin will emit one combined object containing these three arrays.

Line 75:     }).subscribe({
This line closes the forkJoin object and calls subscribe with an observer object argument. subscribe starts the actual HTTP requests and handles the results or errors.

Line 76:       next: (data) => {
This line defines the next handler for the subscription. It is a function that receives a parameter named data. For the object-form of forkJoin, data is an object with properties states, hobbies, and techInterests, each holding the array returned by the corresponding service call. This function runs once, when all three requests have completed successfully.

Line 77:         this.stateChartData = this.buildPieChart(data.states, 'Users by States');
This line sets the stateChartData property by calling this.buildPieChart. It passes two arguments:
data.states – the array of {label, value} for states.
'Users by States' – the dataset label.
buildPieChart transforms the raw array into a ChartData structure with labels and datasets, as well as applying colors. After this assignment, the pie chart bound to [data]="stateChartData" will update and display the state distribution.

Line 78:         this.hobbiesChartData = this.buildBarChart(data.hobbies);
This line sets hobbiesChartData by calling buildBarChart with data.hobbies, the hobbies distribution array. buildBarChart returns a ChartData for a bar chart, and the hobbies chart will update accordingly.

Line 79:         this.techInterestsChartData = this.buildBarChart(data.techInterests, 1);
This line sets techInterestsChartData using buildBarChart with two arguments:
data.techInterests – the tech interests distribution array.
1 – a colorOffset used when picking bar colors so the second bar chart uses a shifted palette.
This ensures the second bar chart uses slightly different colors, while still reusing the same barColors array.

Line 80:       },
This line closes the next handler object property.

Line 81:       error: () => this.toast('error', 'Error', 'Failed to load chart data')
This line defines the error handler for the subscription. If any of the three HTTP requests fail, forkJoin emits an error, and this function runs. It calls this.toast with:
'error' – severity level for PrimeNG MessageService.
'Error' – summary title.
'Failed to load chart data' – detailed message.
This triggers a toast popup informing the user something went wrong while loading charts.

Line 82:     });
This line closes the subscribe call and the ngOnInit method’s main logic.

Line 84:   private buildPieChart(data: { label: string; value: number }[], label: string): ChartData {
This line declares a private helper method named buildPieChart. It takes two parameters:
data: an array of objects each with properties label (string) and value (number). This corresponds to the shape returned by the backend chart endpoints.
label: a string representing the dataset label, like 'Users by States'.
The method returns a ChartData object. Being private means it is only used inside this component.

Line 85:     const colors = this.pieColors.slice(0, data.length);
This line computes a colors array by taking a slice of pieColors from index 0 up to data.length. slice does not modify the original array; it returns a shallow copy. If there are three states, this will pick the first three colors only. This ensures the number of colors matches the number of labels.

Line 86:     return {
This line starts returning an object literal that matches the ChartData interface. This object will be assigned to stateChartData.

Line 87:       labels: data.map(d => d.label),
This line sets labels to an array created by mapping each element of data to its label value. data.map(d => d.label) loops over all items and returns a new array with just the label strings. These become the labels shown in the legend and possibly in tooltips.

Line 88:       datasets: [{
This line starts the datasets array with a single dataset object. We use only one dataset for the pie chart; Chart.js will create one slice per value.

Line 89:         label,
This line sets the dataset label field to the label parameter passed into the function. This describes the dataset as a whole (for example "Users by States"). It can appear in tooltips or legends.

Line 90:         data: data.map(d => d.value),
This line sets the dataset data field to an array created by mapping each item in data to its numeric value. These numbers determine the angle/size of each pie slice.

Line 91:         backgroundColor: colors,
This line assigns the colors array to backgroundColor. Because backgroundColor is an array, Chart.js will use a different color for each slice, in the order given.

Line 92:         borderColor: colors.map(() => '#fff'),
This line sets borderColor to a new array created by mapping over colors and returning '#fff' (white) for each element. This produces an array of white strings, one per slice. Each slice’s border will be white, which visually separates slices and makes them stand out against each other.

Line 93:         borderWidth: 2
This line sets borderWidth to 2 pixels. This makes the white borders thicker and clearly visible around each slice.

Line 94:       }]
This line closes the dataset object and the single-element datasets array.

Line 95:     };
This line closes and returns the ChartData object for the pie chart.

Line 97:   private buildBarChart(data: { label: string; value: number }[], colorOffset = 0): ChartData {
This line declares a second helper method named buildBarChart. It takes:
data: an array of {label, value} for the bar categories.
colorOffset: a number with default value 0. This parameter lets us shift the starting index when picking colors from barColors, so two bar charts can have slightly different palettes.
The method returns a ChartData object for the bar chart.

Line 98:     const colors = data.map((_, i) => this.barColors[(i + colorOffset) % this.barColors.length]);
This line creates a colors array by mapping over data. For each item, we ignore the actual data (using _ as the unused parameter) and use the index i. We calculate (i + colorOffset) % this.barColors.length, which wraps around the barColors array if we have more bars than colors. This picks a bar color for each category. Using colorOffset=1 for the second bar chart shifts the series by one color so the two charts do not start with exactly the same color.

Line 99:     return {
This line starts returning a ChartData object for bar charts.

Line 100:       labels: data.map(d => d.label),
This line sets labels to an array of category names, one for each bar, generated by mapping each data element to its label.

Line 101:       datasets: [{
This line starts a single-element datasets array for the bar chart.

Line 102:         label: 'Users',
This line sets the dataset label to the string 'Users'. In a bar chart context, this indicates that each bar represents the number of users.

Line 103:         data: data.map(d => d.value),
This line sets the dataset data array to the values mapped from input data, determining the height of each bar.

Line 104:         backgroundColor: colors,
This line sets backgroundColor of each bar to the colors array computed earlier.

Line 105:         borderColor: colors.map(c => c.replace('0.85', '1')),
This line constructs borderColor by taking each rgba background color and replacing the substring '0.85' with '1'. This changes the alpha from 0.85 (slightly transparent) to 1 (fully opaque) for the bar border. This creates a solid, crisp outline for each bar.

Line 106:         borderWidth: 1
This line sets bar borderWidth to 1 pixel. This is slightly thinner than the pie slice borders and looks appropriate for bar columns.

Line 107:       }]
This line closes the dataset object and the datasets array.

Line 108:     };
This line closes and returns the ChartData object for a bar chart.

Line 110:   navigateToHome(): void {
This line starts the definition of navigateToHome, a method with no return value. This method is called when the user clicks the Back button in the charts page.

Line 111:     this.router.navigate(['/home']);
This line calls the router’s navigate method with an array containing the string '/home'. Angular interprets this as a route instruction and navigates to the home path. As a result, the home page with the member table and floating pagination is shown. This method does not modify charts, but controls navigation flow.

Line 112:   }
This line closes the navigateToHome method.

Line 114:   private toast(severity: string, summary: string, detail: string): void {
This line declares a private helper method named toast, which takes three string parameters:
severity: for example 'error' or 'success'.
summary: a short title.
detail: a longer message.
It returns void. This wrapper simplifies showing toast messages.

Line 115:     this.messageService.add({ severity, summary, detail, life: 3000 });
This line calls messageService.add with an object describing the toast. The object properties are:
severity – severity level, used by PrimeNG to style the toast.
summary – title text.
detail – message text.
life: 3000 – display duration in milliseconds (3 seconds).
When this is called, a toast notification shows on screen briefly. We use it in the error handler when chart data fails to load.

Line 116:   }
This line closes the toast method.

Line 117: }
This line closes the ChartsComponent class definition.


File: src/app/pages/charts/charts.component.html

Line 1: <div class="charts-container">
This line starts a div (HTML block element) with class charts-container. The class name is used in CSS to style the outer container of the charts page. This div wraps the entire charts layout, including header and chart cards. It provides padding and background styling defined in charts.component.css.

Line 2:   <!-- Header -->
This is an HTML comment describing the next section as the header area. Comments are not displayed in the browser.

Line 3:   <div class="dashboard-header">
This line creates a div with class dashboard-header. This section contains the back button and the title "Analytics Dashboard". The CSS uses this class to align items horizontally and space them correctly.

Line 4:     <button
This line starts a button element. It will become the back button.

Line 5:       pButton
This line uses the pButton attribute directive from PrimeNG. Adding pButton turns a normal HTML button into a styled PrimeNG button with consistent styling and ripple effects.

Line 6:       type="button"
This line sets the HTML button type to "button" to indicate that it does not submit a form. It simply triggers a click event handler.

Line 7:       icon="pi pi-arrow-left"
This line sets the icon attribute used by PrimeNG. "pi pi-arrow-left" refers to PrimeIcons classes; the pButton directive reads this and renders a left-arrow icon inside the button.

Line 8:       label="Back"
This line sets the label attribute, which tells PrimeNG what text to display on the button: "Back". PrimeNG combines the icon and this text.

Line 9:       (click)="navigateToHome()"
This line attaches an Angular click event binding to the button. When the button is clicked, Angular calls the navigateToHome method on the ChartsComponent instance. This navigates the user back to the home page.

Line 10:       class="p-button-text back-button"
This line adds two CSS classes to the button: p-button-text (a PrimeNG style making the button look like a text button) and back-button (a custom class used in charts.component.css for additional styling). These affect padding, colors, and positioning.

Line 11:     ></button>
This line closes the button element opened on line 4. The button is fully defined now.

Line 12:     <div class="header-content">
This line opens a div inside dashboard-header with class header-content. It groups the title and subtitle text, so they can be aligned nicely relative to the back button.

Line 13:       <h1 class="dashboard-title">
This line creates an h1 heading element (top-level heading) with class dashboard-title. It will display "Analytics Dashboard" with an icon. The CSS class controls font size, weight, and margins.

Line 14:         <i class="pi pi-chart-bar"></i>
This line inserts an <i> element (typically used for icons) with classes pi pi-chart-bar. These classes from PrimeIcons render a bar chart icon next to the heading text. It visually indicates that this page is about analytics.

Line 15:         Analytics Dashboard
This line is text content inside the h1 tag. It will appear as the main title: "Analytics Dashboard".

Line 16:       </h1>
This line closes the h1 tag.

Line 17:       <p class="dashboard-subtitle">Visual insights into user data</p>
This line adds a paragraph with class dashboard-subtitle containing the text "Visual insights into user data". It acts as a subtitle describing the purpose of the dashboard. The CSS likely styles it in a lighter color and smaller font.

Line 18:     </div>
This line closes the header-content div.

Line 19:   </div>
This line closes the dashboard-header div.

Line 21:   <p-toast></p-toast>
This line adds a PrimeNG p-toast component. p-toast is a container where toast notifications (from MessageService.add) are shown. Including this component in the template is necessary for any toast messages, such as the error shown when chart loading fails.

Line 23:   <!-- Charts Layout: Pie chart on left, Bar charts on right -->
This comment explains that the next block arranges the charts with a pie chart on the left and bar charts on the right.

Line 24:   <div class="charts-layout">
This line opens a div with class charts-layout. In CSS, this is a grid or flex container that arranges its child elements (chart cards) side by side on larger screens and stacked on smaller screens.

Line 25:     <!-- Left: Pie Chart -->
This comment indicates that the following block contains the pie chart card.

Line 26:     <div class="chart-item pie-chart-item">
This line creates a div with classes chart-item and pie-chart-item. chart-item is a general style for chart cards; pie-chart-item may adjust width or responsive behavior for the left card specifically.

Line 27:       <p-card header="Users by States" styleClass="chart-card">
This line adds a PrimeNG p-card component. header="Users by States" sets the card header text. styleClass="chart-card" attaches a CSS class to the internal card for styling (shadows, padding, etc.). The card visually frames the pie chart with a title.

Line 28:         <div class="chart-wrapper pie-wrapper">
This line creates an inner div with classes chart-wrapper and pie-wrapper. chart-wrapper likely provides fixed height and alignment for charts; pie-wrapper may adjust height and padding for the pie specifically.

Line 29:           <p-chart 
This line starts a PrimeNG p-chart component. p-chart is a wrapper around Chart.js that renders a canvas with the chart.

Line 30:             type="pie" 
This line sets the p-chart type attribute to "pie". PrimeNG passes this to Chart.js so it creates a pie chart instead of bar or line charts. This is why this chart shows slices in a circle.

Line 31:             [data]="stateChartData" 
This line binds the [data] input property of p-chart to the stateChartData property in the component. The square brackets indicate Angular property binding. Whenever stateChartData changes, the chart redraws with the new labels and values.

Line 32:             [options]="chartOptions"
This line binds the [options] input of p-chart to the chartOptions object. This passes our layout, legend, tooltip, and plugin configuration, enabling the custom line-and-label behavior and legend placement.

Line 33:           ></p-chart>
This line closes the p-chart component. The pie chart is fully configured here.

Line 34:         </div>
This line closes the chart-wrapper div.

Line 35:       </p-card>
This line closes the p-card for the pie chart.

Line 36:     </div>
This line closes the pie-chart-item div.

Line 38:     <!-- Right: Two Bar Charts -->
This comment indicates that the next block contains the two bar chart cards.

Line 39:     <div class="bar-charts-container">
This line creates a div with class bar-charts-container. This container groups the two bar chart cards, usually arranged vertically or stacked depending on screen width.

Line 40:       <!-- User Hobbies Bar Chart -->
Comment describing the first bar chart.

Line 41:       <div class="chart-item">
This line opens a chart-item div for the hobbies chart card.

Line 42:         <p-card header="User Hobbies" styleClass="chart-card">
This line creates a p-card component with header "User Hobbies" and styleClass "chart-card". It frames the hobbies bar chart with a title.

Line 43:           <div class="chart-wrapper">
This line opens a chart-wrapper div for the bar chart. It ensures a consistent height and padding.

Line 44:             <p-chart 
This line begins a p-chart for the hobbies bar chart.

Line 45:               type="bar" 
This line sets type="bar", telling p-chart and Chart.js to render a bar chart.

Line 46:               [data]="hobbiesChartData" 
This line binds the bar chart data to the hobbiesChartData object created in ngOnInit.

Line 47:               [options]="barChartOptions"
This line binds the bar chart options to barChartOptions. This controls axes, tooltips, and legend for the bar chart.

Line 48:             ></p-chart>
This line closes the hobbies p-chart component.

Line 49:           </div>
This line closes the chart-wrapper div.

Line 50:         </p-card>
This line closes the p-card for the hobbies chart.

Line 51:       </div>
This line closes the chart-item div for the hobbies chart.

Line 53:       <!-- User Interests Bar Chart -->
Comment describing the second bar chart.

Line 54:       <div class="chart-item">
This line opens another chart-item div for the tech interests chart.

Line 55:         <p-card header="User Interests" styleClass="chart-card">
This line creates a p-card with header "User Interests". It is styled the same as the first bar card.

Line 56:           <div class="chart-wrapper">
This line opens a chart-wrapper div for the interests chart.

Line 57:             <p-chart 
This line begins the p-chart for tech interests.

Line 58:               type="bar" 
This sets type="bar" again, so this is also a bar chart.

Line 59:               [data]="techInterestsChartData" 
This binds the chart data to techInterestsChartData, built by buildBarChart in ngOnInit.

Line 60:               [options]="barChartOptions"
This line reuses the same barChartOptions object as the hobbies chart, giving a consistent look.

Line 61:             ></p-chart>
This closes the interests p-chart.

Line 62:           </div>
This closes the chart-wrapper.

Line 63:         </p-card>
This closes the p-card for the interests chart.

Line 64:       </div>
This closes the chart-item for the interests chart.

Line 65:     </div>
This closes the bar-charts-container div.

Line 66:   </div>
This closes the overall charts-layout div.

Line 67: </div>
This closes the outermost charts-container div. The charts template is complete.

